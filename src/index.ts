import type { Transport } from '@libp2p/interface-transport'
import type { WebRTCDirectTransportComponents, WebRTCPeerTransportInit } from './peer_transport/transport.js'
import { WebRTCDirectTransport } from './peer_transport/transport.js'
import { WebRTCTransport, WebRTCTransportComponents } from './transport.js'

export function webRTC (): (components: WebRTCTransportComponents) => Transport {
  return (components: WebRTCTransportComponents) => new WebRTCTransport(components)
}

export function webRTCDirect (init: WebRTCPeerTransportInit): (components: WebRTCDirectTransportComponents) => Transport {
  return (components: WebRTCDirectTransportComponents) => new WebRTCDirectTransport(components, init)
}
