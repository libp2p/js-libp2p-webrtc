import {Connection} from '@libp2p/interface-connection';
import {CreateListenerOptions, DialOptions, Listener, Transport} from '@libp2p/interface-transport'
import {symbol} from '@libp2p/interface-transport'
import {Multiaddr} from '@multiformats/multiaddr';

export class WebRTCTransport implements Transport {

	async dial(ma: Multiaddr, options: DialOptions): Promise<Connection> {
		throw new Error("not implemented");
	}

	createListener(options: CreateListenerOptions): Listener {
		throw new Error("not implemented");
	}

	filter(multiaddrs: Multiaddr[]): Multiaddr[] {
		return []
	};

	get [Symbol.toStringTag](): string {
		return '@libp2p/webrtc'
	}

	get [symbol](): true {
		return true
	}
}
