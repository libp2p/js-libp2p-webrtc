import type { Connection } from '@libp2p/interface-connection'
import { CreateListenerOptions, DialOptions, Listener, symbol, Transport } from '@libp2p/interface-transport'
import type { ConnectionHandler, TransportManager, Upgrader } from '@libp2p/interface-transport'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'
import type { IncomingStreamData, Registrar } from '@libp2p/interface-registrar'
import { pbStream } from 'it-pb-stream'
import pDefer, { DeferredPromise } from 'p-defer'
import type { PeerId } from '@libp2p/interface-peer-id'
import { abortableDuplex } from 'abortable-iterator'
import { TimeoutController } from 'timeout-abort-controller'
import { WebRTCMultiaddrConnection } from '../maconn.js'
import type { Startable } from '@libp2p/interfaces/startable'
import { DataChannelMuxerFactory } from '../muxer.js'
import { WebRTCPeerListener } from './listener.js'
import type { PeerStore } from '@libp2p/interface-peer-store'
import { logger } from '@libp2p/logger'
import * as pb from './pb/index.js'
import { readCandidatesUntilConnected } from './util.js'

const log = logger('libp2p:webrtc:peer')

const TIMEOUT = 30 * 1000
export const TRANSPORT = '/webrtc-direct'
export const PROTOCOL = '/webrtc-direct/0.0.1'
export const CODE = 276

export interface WebRTCPeerTransportInit {
  rtcConfiguration?: RTCConfiguration
}

export interface WebRTCDirectTransportComponents {
  peerId: PeerId
  registrar: Registrar
  upgrader: Upgrader
  transportManager: TransportManager
  peerStore: PeerStore
}

export class WebRTCDirectTransport implements Transport, Startable {
  private readonly _started = false
  private readonly handler?: ConnectionHandler

  constructor (
    private readonly components: WebRTCDirectTransportComponents,
    private readonly init: WebRTCPeerTransportInit
  ) {}

  isStarted () {
    return this._started
  }

  async start () {
    await this.components.registrar.handle(PROTOCOL, this._onProtocol.bind(this))
    // this.components.peerStore.addEventListener('change:multiaddrs', (event) => {
    //   const { peerId } = event.detail
    // })
  }

  async stop () {
    await this.components.registrar.unhandle(PROTOCOL)
  }

  createListener (options: CreateListenerOptions): Listener {
    return new WebRTCPeerListener(this.components)
  }

  get [Symbol.toStringTag] (): string {
    return '@libp2p/webrtc-direct'
  }

  get [symbol] (): true {
    return true
  }

  filter (multiaddrs: Multiaddr[]): Multiaddr[] {
    return multiaddrs.filter((ma) => {
      const codes = ma.protoCodes()
      return codes.includes(CODE)
    })
  }

  /*
   * dial connects to a remote via the circuit relay or any other protocol
   * and proceeds to upgrade to a webrtc connection.
   * multiaddr of the form: <multiaddr>/webrtc-peer/p2p/<destination-peer>
   * For a circuit relay, this will be of the form
   * <relay address>/p2p/<relay-peer>/p2p-circuit/webrtc-direct/p2p/<destination-peer>
  */
  async dial (ma: Multiaddr, options: DialOptions): Promise<Connection> {
    // extract peer id
    // if (!remotePeerId) {
    //   throw("peerId should be present in multiaddr")
    // }

    const addrs = ma.toString().split(TRANSPORT)
    // look for remote peerId
    let relayed = multiaddr(addrs[0])
    const remotePeerId = ma.getPeerId()
    if (remotePeerId != null) {
      relayed = relayed.encapsulate(multiaddr(`/p2p/${remotePeerId}`))
    }
    if (options.signal == null) {
      options.signal = new AbortSignal()
    }

    const connection = await this.components.transportManager.dial(relayed)
    const rawStream = await connection.newStream([PROTOCOL], options)
    const stream = pbStream(abortableDuplex(rawStream, options.signal)).pb(pb.Message)

    // setup peer connection
    const pc = new RTCPeerConnection(this.init.rtcConfiguration)
    // the label is not relevant to connection initiation but can be
    // useful for debugging
    const channel = pc.createDataChannel('init')

    const connectedPromise = pDefer<void>()
    pc.onconnectionstatechange = (_) => {
      switch (pc.connectionState) {
        case 'connected':
          return connectedPromise.resolve()
        case 'closed':
        case 'disconnected':
        case 'failed':
          return connectedPromise.reject()
      }
    }

    options.signal.onabort = connectedPromise.reject
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
    pc.setLocalDescription(answerSdp)

    await readCandidatesUntilConnected(connectedPromise, pc, stream)

    const result = options.upgrader.upgradeOutbound(
      new WebRTCMultiaddrConnection({
        peerConnection: pc,
        timeline: { open: (new Date()).getTime() },
        remoteAddr: connection.remoteAddr
      }),
      {
        skipProtection: true,
        skipEncryption: true,
        muxerFactory: new DataChannelMuxerFactory(pc, TRANSPORT)
      }
    )
    // close streams
    rawStream.close()
    channel.close()
    void connection.close()
    // TODO: hack
    // await new Promise(res => setTimeout(res, 100))
    return await result
  }

  async _onProtocol ({ connection, stream: rawStream }: IncomingStreamData) {
    const timeoutController = new TimeoutController(TIMEOUT)
    const signal = timeoutController.signal
    const stream = pbStream(abortableDuplex(rawStream, timeoutController.signal)).pb(pb.Message)
    const pc = new RTCPeerConnection(this.init.rtcConfiguration)

    const connectedPromise: DeferredPromise<void> = pDefer()
    signal.onabort = () => connectedPromise.reject()
    // candidate callbacks
    pc.onicecandidate = ({ candidate }) => {
      stream.write({
        type: pb.Message.Type.ICE_CANDIDATE,
        data: (candidate != null) ? JSON.stringify(candidate) : ''
      })
    }
    pc.onconnectionstatechange = (_) => {
      log.trace('received pc state: ', pc.connectionState)
      switch (pc.connectionState) {
        case 'connected':
          connectedPromise.resolve()
          break
        case 'failed':
        case 'disconnected':
        case 'closed':
          connectedPromise.reject()
      }
    }

    // create and write an SDP offer
    const offer = await pc.createOffer()
    pc.setLocalDescription(offer)
    stream.write({ type: pb.Message.Type.SDP_OFFER, data: offer.sdp })

    // read an SDP anwer
    const pbAnswer = await stream.read()
    if (pbAnswer.type != pb.Message.Type.SDP_ANSWER) {
      throw new Error('response message should be an SDP answer')
    }
    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: pbAnswer.data
    })
    await pc.setRemoteDescription(answer)

    // wait until candidates are connected
    await readCandidatesUntilConnected(connectedPromise, pc, stream)
    const muxerFactory = new DataChannelMuxerFactory(pc, '/webrtc-direct')
    const conn = await this.components.upgrader.upgradeInbound(new WebRTCMultiaddrConnection({
      peerConnection: pc,
      timeline: { open: (new Date()).getTime() },
      remoteAddr: connection.remoteAddr
    }), {
      skipEncryption: true,
      skipProtection: true,
      muxerFactory
    })
    rawStream.close()
    if (this.handler != null) {
      this.handler(conn)
    }
  }
}
