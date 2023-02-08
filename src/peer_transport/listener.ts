// import type { ConnectionManager } from '@libp2p/interface-connection-manager'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { ListenerEvents, TransportManager, Upgrader, Listener } from '@libp2p/interface-transport'
import { EventEmitter } from '@libp2p/interfaces/events'
import { multiaddr, Multiaddr } from '@multiformats/multiaddr'

export interface ListenerOptions {
  peerId: PeerId
  upgrader: Upgrader
  transportManager: TransportManager
}

export class WebRTCPeerListener extends EventEmitter<ListenerEvents> implements Listener {
  constructor (
    private readonly opts: ListenerOptions
  ) {
    super()
  }

    private listeningAddrs: Multiaddr[] = []
    async listen (ma: Multiaddr): Promise<void> {
      const baseAddr = multiaddr(ma.toString().split('/webrtc-peer').find(a => a !== ''))
      const tpt = this.opts.transportManager.transportForMultiaddr(baseAddr)
      const listener = tpt?.createListener({ ...this.opts })
      await listener?.listen(baseAddr)
      const listeningAddr = ma.encapsulate(`/p2p/${this.opts.peerId.toString()}`)
      this.listeningAddrs.push(listeningAddr)
      listener?.addEventListener('close', () => {
        this.listeningAddrs = this.listeningAddrs.filter(a => a !== listeningAddr)
      })
    }

    getAddrs (): Multiaddr[] { return this.listeningAddrs }
    async close () { }
}
