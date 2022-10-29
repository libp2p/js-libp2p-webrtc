import { Multiaddr } from '@multiformats/multiaddr';
export declare const mbdecoder: any;
export declare function certhash(ma: Multiaddr): string;
export declare function certhashToFingerprint(ma: Multiaddr): string[];
export declare function fromMultiAddr(ma: Multiaddr, ufrag: string): RTCSessionDescriptionInit;
export declare function munge(desc: RTCSessionDescriptionInit, ufrag: string): RTCSessionDescriptionInit;
//# sourceMappingURL=sdp.d.ts.map