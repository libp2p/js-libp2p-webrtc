import { WebRTCTransport } from './transport.js'
import { WebRTCListenerOptions } from './options.js'
// import { logger } from '@libp2p/logger'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { ConnectionHandler, Listener, ListenerEvents } from '@libp2p/interface-transport'
import { EventEmitter, CustomEvent } from '@libp2p/interfaces/events'

// const log = logger('libp2p:webrtc:listener')

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
//   private readonly peerId: PeerId

  constructor (handler: ConnectionHandler, peerId: PeerId, transport: WebRTCTransport, options: WebRTCListenerOptions) {
    super()

//     this.handler = handler
//     this.peerId = peerId
//     this.transport = transport
//     this.options = options
  }

  async listen (ma: Multiaddr) {
    /*
    // Should only be used if not already listening
    if (this.listeningAddr != null) {
      throw errCode(new Error('listener already in use'), 'ERR_ALREADY_LISTENING')
    }

    const defer = pDefer<void>() // eslint-disable-line @typescript-eslint/no-invalid-void-type

    // Should be kept unmodified
    this.listeningAddr = ma

    let signallingAddr: Multiaddr
    if (!ma.protoCodes().includes(CODE_P2P)) {
      signallingAddr = ma.encapsulate(`/p2p/${this.peerId.toString()}`)
    } else {
      signallingAddr = ma
    }

    this.signallingUrl = cleanUrlSIO(ma)

    log('connecting to signalling server on: %s', this.signallingUrl)
    const server: SignalServer = new SigServer(this.signallingUrl, signallingAddr, this.upgrader, this.handler, this.options.channelOptions)
    server.addEventListener('error', (evt) => {
      const err = evt.detail

      log('error connecting to signalling server %o', err)
      server.close().catch(err => {
        log.error('error closing server after error', err)
      })
      defer.reject(err)
    })
    server.addEventListener('listening', () => {
      log('connected to signalling server')
      this.dispatchEvent(new CustomEvent('listening'))
      defer.resolve()
    })
    server.addEventListener('peer', (evt) => {
      this.transport.peerDiscovered(evt.detail)
    })
    server.addEventListener('connection', (evt) => {
      const conn = evt.detail

      if (conn.remoteAddr == null) {
        try {
          conn.remoteAddr = ma.decapsulateCode(CODE_P2P).encapsulate(`/p2p/${conn.remotePeer.toString()}`)
        } catch (err) {
          log.error('could not determine remote address', err)
        }
      }

      this.dispatchEvent(new CustomEvent('connection', {
        detail: conn
      }))
    })

    // Store listen and signal reference addresses
    this.transport.sigServers.set(this.signallingUrl, server)

    return await defer.promise
      */
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
