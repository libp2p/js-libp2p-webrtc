import type { Transport } from '@libp2p/interface-transport'
import type {WebRTCPeerTransportComponents, WebRTCPeerTransportInit} from './peer_transport/transport.js'
import { WebRTCPeerTransport } from './peer_transport/transport.js'
import { WebRTCTransport, WebRTCTransportComponents } from './transport.js'

export function webRTC (): (components: WebRTCTransportComponents) => Transport {
  return (components: WebRTCTransportComponents) => new WebRTCTransport(components)
}

export function webRTCPeer (init: WebRTCPeerTransportInit): (components: WebRTCPeerTransportComponents) => Transport {
  return (components: WebRTCPeerTransportComponents) => new WebRTCPeerTransport(components, init)
}
