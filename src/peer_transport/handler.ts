import type { IncomingStreamData } from '@libp2p/interface-registrar'
import { pbStream } from 'it-pb-stream'
import pDefer, { type DeferredPromise } from 'p-defer'
import { TimeoutController } from 'timeout-abort-controller'
import { readCandidatesUntilConnected } from './util'
import * as pb from './pb/index.js'
import { abortableDuplex } from 'abortable-iterator'
import { logger } from '@libp2p/logger'
import type { Stream } from '@libp2p/interface-connection'

const DEFAULT_TIMEOUT = 30 * 1000

const log = logger('libp2p:webrtc:peer')

export type IncomingStreamOpts = { rtcConfiguration?: RTCConfiguration } & IncomingStreamData

export async function handleIncomingStream ({ rtcConfiguration, stream: rawStream }: IncomingStreamOpts): Promise<RTCPeerConnection> {
  const timeoutController = new TimeoutController(DEFAULT_TIMEOUT)
  const signal = timeoutController.signal
  const stream = pbStream(abortableDuplex(rawStream, timeoutController.signal)).pb(pb.Message)
  const pc = new RTCPeerConnection(rtcConfiguration)

  const connectedPromise: DeferredPromise<void> = pDefer()
  signal.onabort = () => connectedPromise.reject()
  // candidate callbacks
  pc.onicecandidate = ({ candidate }) => {
    stream.write({
      type: pb.Message.Type.ICE_CANDIDATE,
      data: (candidate != null) ? JSON.stringify(candidate) : ''
    })
  }

  // setup callback for peerconnection state change
  pc.onconnectionstatechange = (_) => {
    log.trace('receiver peerConnectionState state: ', pc.connectionState)
    switch (pc.connectionState) {
      case 'connected':
        connectedPromise.resolve()
        break
      case 'failed':
      case 'disconnected':
      case 'closed':
        connectedPromise.reject()
        break
      default:
        break
    }
  }
  // we create the channel so that the peerconnection has a component for
  // which to collect candidates
  const channel = pc.createDataChannel('init')

  // create and write an SDP offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  stream.write({ type: pb.Message.Type.SDP_OFFER, data: offer.sdp })

  // read an SDP anwer
  const pbAnswer = await stream.read()
  if (pbAnswer.type !== pb.Message.Type.SDP_ANSWER) {
    // TODO: Find better way to print undefined without linter complaining
    throw new Error(`expected message type SDP_ANSWER, received: ${pbAnswer.type ?? 'undefined'} `)
  }
  const answer = new RTCSessionDescription({
    type: 'answer',
    sdp: pbAnswer.data
  })
  await pc.setRemoteDescription(answer)

  // wait until candidates are connected
  await readCandidatesUntilConnected(connectedPromise, pc, stream)
  // close the dummy channel
  channel.close()
  return pc
}

export interface ConnectOptions {
  stream: Stream
  signal: AbortSignal
  rtcConfiguration?: RTCConfiguration
}

export async function connect ({ rtcConfiguration, signal, stream: rawStream }: ConnectOptions): Promise<RTCPeerConnection> {
  const stream = pbStream(abortableDuplex(rawStream, signal)).pb(pb.Message)

  // setup peer connection
  const pc = new RTCPeerConnection(rtcConfiguration)
  // the label is not relevant to connection initiation but can be
  // useful for debugging

  const connectedPromise = pDefer()
  pc.onconnectionstatechange = (_) => {
    switch (pc.connectionState) {
      case 'connected':
        return connectedPromise.resolve()
      case 'closed':
      case 'disconnected':
      case 'failed':
        return connectedPromise.reject()
      default:
    }
  }

  // reject the connectedPromise if the signal aborts
  signal.onabort = connectedPromise.reject
  // setup callback to write ICE candidates to the remote
  // peer
  pc.onicecandidate = ({ candidate }) => {
    stream.write({
      type: pb.Message.Type.ICE_CANDIDATE,
      data: (candidate != null) ? JSON.stringify(candidate) : ''
    })
  }

  // read offer
  const offerMessage = await stream.read()
  if (offerMessage.type !== pb.Message.Type.SDP_OFFER) {
    throw new Error('remote should send an SDP offer')
  }

  const offerSdp = new RTCSessionDescription({ type: 'offer', sdp: offerMessage.data })
  await pc.setRemoteDescription(offerSdp)

  // create an answer
  const answerSdp = await pc.createAnswer()
  // write the answer to the stream
  stream.write({ type: pb.Message.Type.SDP_ANSWER, data: answerSdp.sdp })
  // set answer as local description
  await pc.setLocalDescription(answerSdp)

  await readCandidatesUntilConnected(connectedPromise, pc, stream)
  return pc
}
export { }
