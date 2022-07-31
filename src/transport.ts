import {createListener}        from './listener.js'
import {toMultiaddrConnection} from './socket-to-conn.js'
import {Components}         from '@libp2p/components'
import {Connection}            from '@libp2p/interface-connection';
import {CreateListenerOptions} from '@libp2p/interface-transport'
import {Listener, Transport}   from '@libp2p/interface-transport'
import {DialOptions}           from '@libp2p/interface-transport'
import {symbol}                from '@libp2p/interface-transport'
import {logger}                from '@libp2p/logger'
import {Multiaddr}             from '@multiformats/multiaddr';
import {WebRTCInitiator}       from '@libp2p/webrtc-peer'

const log = logger('libp2p:webrtc:transport')
const noop = () => {}

export interface WebRTCDialOptions extends DialOptions {
//   channelOptions?: WebRTCInitiatorInit
}

function ma2sdp(ma: Multiaddr): RTCSessionDescription {
	return new RTCSessionDescription(JSON.parse("{TODO: \"" + ma + "\"}"));
}

export class WebRTCTransport implements Transport {

	async dial(ma: Multiaddr, options: DialOptions): Promise<Connection> {
		const rawConn = this._connect(ma, options)
		const maConn = toMultiaddrConnection(rawConn, { remoteAddr: ma, signal: options.signal })
		log('new outbound connection %s', maConn.remoteAddr)
		throw new Error("not implemented");
	}

	createListener(options: CreateListenerOptions): Listener {
		return createListener(options.handler ?? noop, this.components.getPeerId(), this, options)
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
		this.channel = this.peer_connection.createDataChannel("channel");
		this.channel.onopen = this.todo_cb;
		this.channel.onclose = this.todo_cb;
		this.peer_connection.onicecandidate = this.todo_cb;
		this.peer_connection.setRemoteDescription(ma2sdp(ma));
		this.peer_connection.createOffer()
		.then((offer) => this.peer_connection.setLocalDescription(offer));
		return new WebRTCInitiator();
    }

    private components: Components = new Components()
	private peer_connection: RTCPeerConnection = new RTCPeerConnection()
	private channel?: RTCDataChannel

}
