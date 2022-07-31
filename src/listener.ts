import { WebRTCListenerOptions } from './options.js'
// import { WebRTCSocket, HandshakeSignal } from './socket.js'
// import { WebRTCSocket } from './socket.js'
import { WebRTCTransport } from './transport.js'
import { logger } from '@libp2p/logger'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { ConnectionHandler, Listener, ListenerEvents } from '@libp2p/interface-transport'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces/events'
// import { connect } from 'socket.io-client'

const log = logger('libp2p:webrtc:listener')

// const CODE_P2P = 421;

/*
const sioOptions = {
  transports: ['websocket'],
  'force new connection': true,
  path: '/socket.io-next/' // This should be removed when socket.io@2 support is removed
}
*/

class WebRTCListener extends EventEmitter<ListenerEvents> implements Listener {
  private listeningAddr?: Multiaddr
//   private signallingUrl?: string
//   private readonly transport: WebRTCTransport
//   private options?: WebRTCListenerOptions
//   private readonly handler: ConnectionHandler
  private readonly peerId: PeerId
//   public socket: WebRTCSocket

  constructor (handler: ConnectionHandler, peerId: PeerId, transport: WebRTCTransport, options: WebRTCListenerOptions) {
    super()
//     this.socket = connect(signallingUrl, sioOptions)
//     this.handler = handler
    this.peerId = peerId
//     this.transport = transport
//     this.options = options
  }

  async listen (ma: Multiaddr) {
    this.listeningAddr = ma;
    log('peer %s, listen to %s', this.peerId, ma);
  }

  async close () {

    this.dispatchEvent(new CustomEvent('close'))

    // Reset state
    this.listeningAddr = undefined
  }

  getAddrs () {
    if (this.listeningAddr != null) {
      return [
        this.listeningAddr
      ]
    }

    return []
  }
}

export function createListener (handler: ConnectionHandler, peerId: PeerId, transport: WebRTCTransport, options: WebRTCListenerOptions) {
  return new WebRTCListener(handler, peerId, transport, options)
}
