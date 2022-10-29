import { MultiaddrConnection, MultiaddrConnectionTimeline } from "@libp2p/interface-connection";
import { Multiaddr } from "@multiformats/multiaddr";
import { Source, Sink } from "it-stream-types";
declare type WebRTCMultiaddrConnectionInit = {
    peerConnection: RTCPeerConnection;
    remoteAddr: Multiaddr;
    timeline: MultiaddrConnectionTimeline;
};
export declare class WebRTCMultiaddrConnection implements MultiaddrConnection {
    private peerConnection;
    remoteAddr: Multiaddr;
    timeline: MultiaddrConnectionTimeline;
    source: Source<Uint8Array>;
    sink: Sink<Uint8Array, Promise<void>>;
    constructor(init: WebRTCMultiaddrConnectionInit);
    close(err?: Error | undefined): Promise<void>;
}
export {};
//# sourceMappingURL=maconn.d.ts.map