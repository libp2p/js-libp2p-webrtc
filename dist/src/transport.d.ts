import { WebRTCDialOptions } from './options.js';
import { Connection } from '@libp2p/interface-connection';
import type { PeerId } from '@libp2p/interface-peer-id';
import { CreateListenerOptions, Listener, symbol, Transport } from '@libp2p/interface-transport';
import { Multiaddr } from '@multiformats/multiaddr';
export interface WebRTCTransportComponents {
    peerId: PeerId;
}
export declare class WebRTCTransport implements Transport {
    private components;
    constructor(components: WebRTCTransportComponents);
    dial(ma: Multiaddr, options: WebRTCDialOptions): Promise<Connection>;
    createListener(options: CreateListenerOptions): Listener;
    filter(multiaddrs: Multiaddr[]): Multiaddr[];
    get [Symbol.toStringTag](): string;
    get [symbol](): true;
    _connect(ma: Multiaddr, options: WebRTCDialOptions): Promise<Connection>;
    private generateNoisePrologue;
}
//# sourceMappingURL=transport.d.ts.map