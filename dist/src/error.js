import { default as createError } from 'err-code';
import '@libp2p/interface-connection';
export class WebRTCTransportError extends Error {
    constructor(msg) {
        super('WebRTC transport error: ' + msg);
        this.name = 'WebRTCTransportError';
    }
}
export var codes;
(function (codes) {
    codes["ERR_ALREADY_ABORTED"] = "ERR_ALREADY_ABORTED";
    codes["ERR_DATA_CHANNEL"] = "ERR_DATA_CHANNEL";
    codes["ERR_INVALID_MULTIADDR"] = "ERR_INVALID_MULTIADDR";
    codes["ERR_INVALID_PARAMETERS"] = "ERR_INVALID_PARAMETERS";
    codes["ERR_HASH_NOT_SUPPORTED"] = "ERR_HASH_NOT_SUPPORTED";
    codes["ERR_NOT_IMPLEMENTED"] = "ERR_NOT_IMPLEMENTED";
    codes["ERR_TOO_MANY_INBOUND_PROTOCOL_STREAMS"] = "ERR_TOO_MANY_INBOUND_PROTOCOL_STREAMS";
    codes["ERR_TOO_MANY_OUTBOUND_PROTOCOL_STREAMS"] = "ERR_TOO_MANY_OUTBOUND_PROTOCOL_STREAMS";
    codes["ERR_CONNECTION_CLOSED"] = "ERR_CONNECTION_CLOSED";
})(codes || (codes = {}));
export class ConnectionClosedError extends WebRTCTransportError {
    constructor(state, msg) {
        super(`peerconnection moved to state: ${state}:` + msg);
        this.name = 'WebRTC/ConnectionClosed';
    }
}
export function connectionClosedError(state, msg) {
    return createError(new ConnectionClosedError(state, msg), codes.ERR_CONNECTION_CLOSED);
}
export class InvalidArgumentError extends WebRTCTransportError {
    constructor(msg) {
        super('There was a problem with a provided argument: ' + msg);
        this.name = 'WebRTC/InvalidArgumentError';
    }
}
export function unsupportedHashAlgorithm(algorithm) {
    return createError(new UnsupportedHashAlgorithmError(algorithm), codes.ERR_HASH_NOT_SUPPORTED);
}
export class UnsupportedHashAlgorithmError extends WebRTCTransportError {
    constructor(algo) {
        let msg = `unsupported hash algorithm: ${algo}`;
        super(msg);
        this.name = 'WebRTC/UnsupportedHashAlgorithmError';
    }
}
export function invalidArgument(msg) {
    return createError(new InvalidArgumentError(msg), codes.ERR_INVALID_PARAMETERS);
}
export class UnimplementedError extends WebRTCTransportError {
    constructor(methodName) {
        super('A method (' + methodName + ') was called though it has been intentionally left unimplemented.');
        this.name = 'WebRTC/UnimplementedError';
    }
}
export function unimplemented(methodName) {
    return createError(new UnimplementedError(methodName), codes.ERR_NOT_IMPLEMENTED);
}
export class InappropriateMultiaddrError extends WebRTCTransportError {
    constructor(msg) {
        super('There was a problem with the Multiaddr which was passed in: ' + msg);
        this.name = 'WebRTC/InappropriateMultiaddrError';
    }
}
export function inappropriateMultiaddr(msg) {
    return createError(new InappropriateMultiaddrError(msg), codes.ERR_INVALID_MULTIADDR);
}
export class OperationAbortedError extends WebRTCTransportError {
    constructor(context, abortReason) {
        super(`Signalled to abort because (${abortReason}})${context}`);
        this.name = 'WebRTC/OperationAbortedError';
    }
}
export function operationAborted(context, reason) {
    return createError(new OperationAbortedError(context, reason), codes.ERR_ALREADY_ABORTED);
}
export class DataChannelError extends WebRTCTransportError {
    constructor(streamLabel, errorMessage) {
        super(`[stream: ${streamLabel}] data channel error: ${errorMessage}`);
        this.name = 'WebRTC/DataChannelError';
    }
}
export function dataChannelError(streamLabel, msg) {
    return createError(new DataChannelError(streamLabel, msg), codes.ERR_DATA_CHANNEL);
}
export class StreamingLimitationError extends WebRTCTransportError {
    constructor(msg) {
        super(msg);
        this.name = 'WebRTC/StreamingLimitationError';
    }
}
export function overStreamLimit(dir, proto) {
    let code = dir == 'inbound' ? codes.ERR_TOO_MANY_INBOUND_PROTOCOL_STREAMS : codes.ERR_TOO_MANY_OUTBOUND_PROTOCOL_STREAMS;
    return createError(new StreamingLimitationError(`${dir} stream limit reached for protocol - ${proto}`), code);
}
//# sourceMappingURL=error.js.map