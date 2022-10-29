// import {Components} from "@libp2p/components"
import "@libp2p/interface-connection";
import "@libp2p/interface-stream-muxer";
import "it-stream-types";
import { v4 } from "uuid";
import { WebRTCStream } from "./stream.js";
import { nopSink, nopSource } from "./util.js";
export class DataChannelMuxerFactory {
    constructor(peerConnection) {
        this.protocol = '/webrtc';
        this.peerConnection = peerConnection;
    }
    createStreamMuxer(init) {
        return new DataChannelMuxer(this.peerConnection, init);
    }
}
export class DataChannelMuxer {
    constructor(peerConnection, init) {
        this.protocol = "/webrtc";
        this.streams = [];
        this.close = () => { };
        // nop source and sink, since the transport natively supports
        // multiplexing
        this.source = nopSource;
        this.sink = nopSink;
        this.init = init;
        this.peerConnection = peerConnection;
        this.peerConnection.ondatachannel = ({ channel }) => {
            const stream = new WebRTCStream({
                channel,
                stat: {
                    direction: 'inbound',
                    timeline: {
                        open: 0,
                    }
                },
                closeCb: init?.onStreamEnd
            });
            if (init?.onIncomingStream) {
                init.onIncomingStream(stream);
            }
        };
    }
    newStream(name) {
        const streamName = name || v4();
        const channel = this.peerConnection.createDataChannel(streamName);
        const stream = new WebRTCStream({
            channel,
            stat: {
                direction: 'outbound',
                timeline: {
                    open: 0,
                },
            },
            closeCb: this.init?.onStreamEnd
        });
        return stream;
    }
}
// export {}
//# sourceMappingURL=muxer.js.map