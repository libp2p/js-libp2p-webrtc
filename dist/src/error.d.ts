import { default as createError } from 'err-code';
import { Direction } from '@libp2p/interface-connection';
export declare class WebRTCTransportError extends Error {
    constructor(msg: string);
}
export declare enum codes {
    ERR_ALREADY_ABORTED = "ERR_ALREADY_ABORTED",
    ERR_DATA_CHANNEL = "ERR_DATA_CHANNEL",
    ERR_INVALID_MULTIADDR = "ERR_INVALID_MULTIADDR",
    ERR_INVALID_PARAMETERS = "ERR_INVALID_PARAMETERS",
    ERR_HASH_NOT_SUPPORTED = "ERR_HASH_NOT_SUPPORTED",
    ERR_NOT_IMPLEMENTED = "ERR_NOT_IMPLEMENTED",
    ERR_TOO_MANY_INBOUND_PROTOCOL_STREAMS = "ERR_TOO_MANY_INBOUND_PROTOCOL_STREAMS",
    ERR_TOO_MANY_OUTBOUND_PROTOCOL_STREAMS = "ERR_TOO_MANY_OUTBOUND_PROTOCOL_STREAMS",
    ERR_CONNECTION_CLOSED = "ERR_CONNECTION_CLOSED"
}
export declare class ConnectionClosedError extends WebRTCTransportError {
    constructor(state: RTCPeerConnectionState, msg: string);
}
export declare function connectionClosedError(state: RTCPeerConnectionState, msg: string): Error & createError.Extensions;
export declare class InvalidArgumentError extends WebRTCTransportError {
    constructor(msg: string);
}
export declare function unsupportedHashAlgorithm(algorithm: string): Error & createError.Extensions;
export declare class UnsupportedHashAlgorithmError extends WebRTCTransportError {
    constructor(algo: string);
}
export declare function invalidArgument(msg: string): Error & createError.Extensions;
export declare class UnimplementedError extends WebRTCTransportError {
    constructor(methodName: string);
}
export declare function unimplemented(methodName: string): Error & createError.Extensions;
export declare class InappropriateMultiaddrError extends WebRTCTransportError {
    constructor(msg: string);
}
export declare function inappropriateMultiaddr(msg: string): Error & createError.Extensions;
export declare class OperationAbortedError extends WebRTCTransportError {
    constructor(context: string, abortReason: string);
}
export declare function operationAborted(context: string, reason: string): Error & createError.Extensions;
export declare class DataChannelError extends WebRTCTransportError {
    constructor(streamLabel: string, errorMessage: string);
}
export declare function dataChannelError(streamLabel: string, msg: string): Error & createError.Extensions;
export declare class StreamingLimitationError extends WebRTCTransportError {
    constructor(msg: string);
}
export declare function overStreamLimit(dir: Direction, proto: string): Error & createError.Extensions;
//# sourceMappingURL=error.d.ts.map