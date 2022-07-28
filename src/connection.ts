import { Connection, ConnectionStat, Stream, Direction } from '@libp2p/interface-connection'
import { PeerId } from '@libp2p/interface-peer-id';
import { AbortOptions } from '@libp2p/interfaces';
import { Multiaddr } from '@multiformats/multiaddr';

// interface WRTC {
//     RTCPeerConnection: typeof RTCPeerConnection
//     RTCSessionDescription: typeof RTCSessionDescription
//     RTCIceCandidate: typeof RTCIceCandidate
// }

type ConnectionInit = {
    id: string
    localPeer: PeerId
    localAddr?: Multiaddr
    remotePeer: PeerId
    remoteAddr: Multiaddr
    direction: Direction
    tags?: string[]
    stat: ConnectionStat
}



export class WebRTCConnection implements Connection {
    id: string;
    stat: ConnectionStat;
    remoteAddr: Multiaddr;
    remotePeer: PeerId;
    tags: string[] = [];
    streams: Stream[] = [];
    direction: Direction;

    constructor(init: ConnectionInit) {
        this.streams = []
        this.remotePeer = init.remotePeer
        this.remoteAddr = init.remoteAddr
        this.stat = init.stat
        this.id = init.id
        this.direction = init.direction
    }

    async newStream(multicodecs: string | string[], options?: AbortOptions): Promise<Stream> {
        throw new Error("not implemented")
    }

    addStream(stream: Stream): void {
        throw new Error("not implemented")
    }
    removeStream(id: string): void {
        throw new Error("not implemented")
    }
    async close(): Promise<void> {
        throw new Error("not implemented")
    }
}

