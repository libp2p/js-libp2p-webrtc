import type { Transport } from '@libp2p/interface-transport'
import { WebRTCTransport, WebRTCTransportComponents } from './transport.js'

export function webRTC (): (components: WebRTCTransportComponents) => Transport {
  return (components: WebRTCTransportComponents) => new WebRTCTransport(components)
}
