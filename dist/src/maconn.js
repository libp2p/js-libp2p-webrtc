import "@libp2p/interface-connection";
import { logger } from '@libp2p/logger';
import "@multiformats/multiaddr";
import "it-stream-types";
import { nopSink, nopSource } from "./util.js";
const log = logger('libp2p:webrtc:connection');
export class WebRTCMultiaddrConnection {
    constructor(init) {
        this.source = nopSource;
        this.sink = nopSink;
        this.remoteAddr = init.remoteAddr;
        this.timeline = init.timeline;
        this.peerConnection = init.peerConnection;
    }
    async close(err) {
        log.error("error closing connection", err);
        this.peerConnection.close();
    }
}
//# sourceMappingURL=maconn.js.map