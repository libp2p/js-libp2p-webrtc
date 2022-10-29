import '@libp2p/interface-transport';
import { WebRTCTransport } from './transport.js';
export function webRTC() {
    return (components) => new WebRTCTransport(components);
}
//# sourceMappingURL=index.js.map