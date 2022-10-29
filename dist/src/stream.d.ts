import { Stream, StreamStat, Direction } from '@libp2p/interface-connection';
import { Source } from 'it-stream-types';
import { Sink } from 'it-stream-types';
import { DeferredPromise } from 'p-defer';
import { Uint8ArrayList } from 'uint8arraylist';
export declare function defaultStat(dir: Direction): StreamStat;
declare type StreamInitOpts = {
    channel: RTCDataChannel;
    metadata?: Record<string, any>;
    stat: StreamStat;
    closeCb?: (stream: WebRTCStream) => void;
};
export declare class WebRTCStream implements Stream {
    /**
     * Unique identifier for a stream
     */
    id: string;
    /**
     * Stats about this stream
     */
    stat: StreamStat;
    /**
     * User defined stream metadata
     */
    metadata: Record<string, any>;
    private readonly channel;
    _src: Source<Uint8ArrayList>;
    sink: Sink<Uint8ArrayList | Uint8Array, Promise<void>>;
    opened: DeferredPromise<void>;
    closeWritePromise: DeferredPromise<void>;
    writeClosed: boolean;
    readClosed: boolean;
    closed: boolean;
    closeCb?: (stream: WebRTCStream) => void | undefined;
    constructor(opts: StreamInitOpts);
    set source(_src: Source<Uint8ArrayList>);
    get source(): Source<Uint8ArrayList>;
    private _sinkFn;
    /**
     * Close a stream for reading and writing
     */
    close(): void;
    /**
     * Close a stream for reading only
     */
    closeRead(): void;
    /**
     * Close a stream for writing only
     */
    closeWrite(): void;
    /**
     * Call when a local error occurs, should close the stream for reading and writing
     */
    abort(err: Error): void;
    /**
     * Close the stream for writing, and indicate to the remote side this is being done 'abruptly'
     * @see closeWrite
     */
    reset(): void;
    private _sendFlag;
}
export {};
//# sourceMappingURL=stream.d.ts.map