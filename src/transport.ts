import {Connection}            from '@libp2p/interface-connection';
import {CreateListenerOptions} from '@libp2p/interface-transport'
import {Listener, Transport}   from '@libp2p/interface-transport'
import {DialOptions}           from '@libp2p/interface-transport'
import {symbol}                from '@libp2p/interface-transport'
import {logger}                from '@libp2p/logger'
import {Multiaddr}             from '@multiformats/multiaddr';

const log = logger('libp2p:webrtc:transport')

export interface WebRTCDialOptions extends DialOptions {
//   channelOptions?: WebRTCInitiatorInit
}

function ma2sdp(ma: Multiaddr): RTCSessionDescription {
	return new RTCSessionDescription(JSON.parse("{TODO: \"" + ma + "\"}"));
}

export class WebRTCTransport implements Transport {

	async dial(ma: Multiaddr, options: DialOptions): Promise<Connection> {
		const rawConn = this._connect(ma, options);
		log('new outbound connection %s', rawConn);
		throw new Error("not implemented");
	}

	createListener(options: CreateListenerOptions): Listener {
		throw new Error("TODO - replace with an exception more appropriate to the fact that this will not be implemented.");
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

	todo_cb() {
	}

	_connect (ma: Multiaddr, options: WebRTCDialOptions) {
		this.channel = this.peer_connection.createDataChannel("data");
		this.peer_connection.createOffer().then((offer) => this.peer_connection.setLocalDescription(offer));
		this.channel.onopen = this.todo_cb;
		this.channel.onclose = this.todo_cb;
		this.peer_connection.setRemoteDescription(ma2sdp(ma));

    }

	private peer_connection: RTCPeerConnection = new RTCPeerConnection()
	private channel?: RTCDataChannel

}
