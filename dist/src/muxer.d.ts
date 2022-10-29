import { Stream } from "@libp2p/interface-connection";
import { StreamMuxer, StreamMuxerFactory, StreamMuxerInit } from "@libp2p/interface-stream-muxer";
import { Source, Sink } from "it-stream-types";
export declare class DataChannelMuxerFactory implements StreamMuxerFactory {
    private peerConnection;
    protocol: string;
    constructor(peerConnection: RTCPeerConnection);
    createStreamMuxer(init?: StreamMuxerInit | undefined): StreamMuxer;
}
export declare class DataChannelMuxer implements StreamMuxer {
    private readonly peerConnection;
    readonly protocol: string;
    streams: Stream[];
    init?: StreamMuxerInit;
    close: (err?: Error | undefined) => void;
    source: Source<Uint8Array>;
    sink: Sink<Uint8Array, Promise<void>>;
    constructor(peerConnection: RTCPeerConnection, init?: StreamMuxerInit);
    newStream(name?: string | undefined): Stream;
}
//# sourceMappingURL=muxer.d.ts.map