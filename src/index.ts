import type { Transport } from '@libp2p/interface-transport'
import type { WebRTCTransportComponents, WebRTCTransportInit } from './peer_transport/transport.js'
import { WebRTCTransport } from './peer_transport/transport.js'
import { WebRTCDirectTransport, WebRTCDirectTransportComponents } from './transport.js'

export function webRTCDirect (): (components: WebRTCDirectTransportComponents) => Transport {
  return (components: WebRTCDirectTransportComponents) => new WebRTCDirectTransport(components)
}

export function webRTC (init?: WebRTCTransportInit): (components: WebRTCTransportComponents) => Transport {
  return (components: WebRTCTransportComponents) => new WebRTCTransport(components, init ?? {})
}
