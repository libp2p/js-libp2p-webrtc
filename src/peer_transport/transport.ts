import type {Connection} from "@libp2p/interface-connection";
import {CreateListenerOptions, DialOptions, Listener, symbol, Transport} from "@libp2p/interface-transport";
import type {ConnectionHandler, TransportManager, Upgrader} from "@libp2p/interface-transport";
import {multiaddr, Multiaddr} from "@multiformats/multiaddr";
import type {IncomingStreamData} from "@libp2p/interface-registrar"
import {pbStream, ProtobufStream} from 'it-pb-stream'
import pDefer, {DeferredPromise} from "p-defer";
import type {Registrar} from '@libp2p/interface-registrar'
import type {PeerId} from "@libp2p/interface-peer-id";
import {abortableDuplex} from 'abortable-iterator'
import {TimeoutController} from 'timeout-abort-controller'
import {WebRTCMultiaddrConnection} from "../maconn.js";
import type {Startable} from "@libp2p/interfaces/startable"
import {DataChannelMuxerFactory} from "../muxer.js";
import {WebRTCPeerListener} from "./listener.js";
import type {PeerStore} from '@libp2p/interface-peer-store'
import {logger} from "@libp2p/logger";
import * as pb from '../../proto_ts/peer_transport/pb/hs.js'

const log = logger('webrtc-peer')

const TIMEOUT = 30 * 1000
export const TRANSPORT = '/webrtc-peer'
export const PROTOCOL = '/webrtc-peer/0.0.1'
export const CODE = 281

export type WebRTCPeerTransportInit = {
  rtcConfiguration?: RTCConfiguration
}

export type WebRTCPeerTransportComponents = {
  peerId: PeerId
  registrar: Registrar
  upgrader: Upgrader
  transportManager: TransportManager
  peerStore: PeerStore
};

export class WebRTCPeerTransport implements Transport, Startable {
  private _started = false
  private handler?: ConnectionHandler

  constructor(
    private readonly components: WebRTCPeerTransportComponents,
    private readonly init: WebRTCPeerTransportInit,
  ) {}

  isStarted() {
    return this._started
  }

  async start() {
    await this.components.registrar.handle(PROTOCOL, this._onProtocol.bind(this))
    // this.components.peerStore.addEventListener('change:multiaddrs', (event) => {
    //   const { peerId } = event.detail
    // })
  }
  async stop() {
    await this.components.registrar.unhandle(PROTOCOL)
  }

  createListener(options: CreateListenerOptions): Listener {
    return new WebRTCPeerListener(this.components)
  }

  get [Symbol.toStringTag](): string {
    return '@libp2p/webrtc-peer'
  }

  get [symbol](): true {
    return true
  }

  filter(multiaddrs: Multiaddr[]): Multiaddr[] {
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
   * <relay address>/p2p/<relay-peer>/p2p-circuit/p2p/<destination-peer>/webrtc-sdp/p2p/<destination-peer>
  */
  async dial(ma: Multiaddr, options: DialOptions): Promise<Connection> {
    // extract peer id
    const addrs = ma.toString().split('/webrtc-peer')
    const relayed = multiaddr(addrs[0])
    // const destination = multiaddr(addrs[addrs.length - 1])
    //
    log(this.init)

    if (!options.signal) {
      options.signal = new AbortSignal()
    }
    const connection = await this.components.transportManager.dial(relayed)
    const rawStream = await connection.newStream([PROTOCOL], options)
    const stream = pbStream(abortableDuplex(rawStream, options.signal))

    const pc = new RTCPeerConnection(this.init.rtcConfiguration)
    const channel = pc.createDataChannel("init")
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const connectedPromise = pDefer<number>();
    pc.onconnectionstatechange = (_) => {
      switch (pc.connectionState) {
        case 'connected':
          return connectedPromise.resolve(0);
        case 'closed':
        case 'disconnected':
        case 'failed':
          return connectedPromise.reject();
      }
    }
    options.signal.onabort = connectedPromise.reject
    pc.onicecandidate = ({candidate}) => {
      writeMessage(stream, {
        type: pb.Message_MessageType.CANDIDATE,
        data: candidate ? JSON.stringify(candidate) : '',
      });
    }
    // write offer
    writeMessage(stream, {type: pb.Message_MessageType.OFFER, data: offer.sdp!})

    // read answer
    const answerMessage = await readMessage(stream)
    if (answerMessage.type != pb.Message_MessageType.ANSWER) {
      throw new Error('should read answer')
    }

    const answerSdp = new RTCSessionDescription({type: 'answer', sdp: answerMessage.data})
    await pc.setRemoteDescription(answerSdp)

    let continueReading = true
    while (continueReading) {
      const result = await Promise.race([connectedPromise.promise, readMessage(stream)])
      if (result === 0) {
        break;
      }

      const message = result as pb.Message
      if (message.type != pb.Message_MessageType.CANDIDATE) {
        continue
      }

      if (message.data == '') {
        continueReading = false
        break
      }

      const candidate = new RTCIceCandidate(JSON.parse(message.data))
      pc.addIceCandidate(candidate)
    }

    await connectedPromise.promise
    rawStream.close()
    channel.close()
    const result = options.upgrader.upgradeOutbound(
      new WebRTCMultiaddrConnection({
        peerConnection: pc,
        timeline: {open: (new Date()).getTime()},
        remoteAddr: connection.remoteAddr,
      }),
      {
        skipProtection: true,
        skipEncryption: true,
        muxerFactory: new DataChannelMuxerFactory(pc, '/webrtc-peer'),
      }
    )
    // TODO: hack
    await new Promise(res => setTimeout(res, 100))
    return result
  }

  async _onProtocol({connection, stream: rawStream}: IncomingStreamData) {
    const timeoutController = new TimeoutController(TIMEOUT)
    const signal = timeoutController.signal
    const stream = pbStream(abortableDuplex(rawStream, timeoutController.signal))
    const pc = new RTCPeerConnection(this.init.rtcConfiguration)

    const connectedPromise: DeferredPromise<number> = pDefer()
    signal.onabort = () => connectedPromise.reject()
    // candidate callbacks
    pc.onicecandidate = ({candidate}) => {
      writeMessage(stream, {
        type: pb.Message_MessageType.CANDIDATE,
        data: candidate ? JSON.stringify(candidate!.toJSON()) : '',
      })
    }
    pc.onconnectionstatechange = (_) => {
      log.trace('received pc state: ', pc.connectionState)
      switch (pc.connectionState) {
        case 'connected':
          connectedPromise.resolve(0)
          break
        case 'failed':
        case 'disconnected':
        case 'closed':
          connectedPromise.reject()
      }
    }

    const pbOffer = await readMessage(stream)
    if (pbOffer.type != pb.Message_MessageType.OFFER) {
      throw new Error('initial message should be an offer')
    }
    const offer = new RTCSessionDescription({
      type: 'offer',
      sdp: pbOffer.data,
    })

    await pc.setRemoteDescription(offer)
    log.trace('offer', offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    writeMessage(stream, {type: pb.Message_MessageType.ANSWER, data: answer.sdp!})
    log.trace('answer', offer)
    let continueReading = true
    while (continueReading) {
      const result = await Promise.race([connectedPromise.promise, readMessage(stream)])
      if (result === 0) {
        break;
      }

      const message = result as pb.Message
      if (message.type != pb.Message_MessageType.CANDIDATE) {
        throw new Error('should only receive trickle candidates')
      }
      if (message.data === '') {
        continueReading = false
        break
      }

      const candidate = new RTCIceCandidate(JSON.parse(message.data))
      await pc.addIceCandidate(candidate)
    }
    await connectedPromise.promise;
    rawStream.close()
    const muxerFactory = new DataChannelMuxerFactory(pc, '/webrtc-peer')
    const conn = await this.components.upgrader.upgradeInbound(new WebRTCMultiaddrConnection({
      peerConnection: pc,
      timeline: {open: (new Date()).getTime()},
      remoteAddr: connection.remoteAddr,
    }), {
      skipEncryption: true,
      skipProtection: true,
      muxerFactory
    })
    if (this.handler) {
      this.handler(conn)
    }
  }
}

function writeMessage(stream: ProtobufStream, message: pb.Message) {
  stream.writeLP(pb.Message.toBinary(message))
}

async function readMessage(stream: ProtobufStream): Promise<pb.Message> {
  const raw = await stream.readLP()
  return pb.Message.fromBinary(raw.subarray())
}
