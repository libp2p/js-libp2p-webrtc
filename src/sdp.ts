import { logger }    from '@libp2p/logger'
import { Multiaddr } from '@multiformats/multiaddr'

const log = logger('libp2p:webrtc:sdp')

const SDP_FORMAT: string = `
v=0
o=- 0 0 IN %s %s
s=-
c=IN %s %s
t=0 0
m=application %d UDP/DTLS/SCTP webrtc-datachannel
a=mid:0
a=ice-options:ice2
a=ice-ufrag:%s
a=ice-pwd:%s
a=fingerprint:%s
a=setup:actpass
a=sctp-port:5000
a=max-message-size:100000
`;

function ipv(ma: Multiaddr): string {
    //TODO: check if we need to support /dns* MAs
    for ( let proto of ma.protoNames() ) {
        if ( proto.startsWith('ip') ) {
            return proto.toUpperCase();
        }
    }
    log("Warning: multiaddr does not appear to contain IP4 or IP6.",ma);
    return "IP6";
}
function ip(ma: Multiaddr): string {
    return ma.toOptions().host;
}
function port(ma: Multiaddr): number {
    return ma.toOptions().port;
}

export function fromMultiAddr(ma: Multiaddr): string {
    return SDP_FORMAT.replace('/%s/', ipv(ma))
        .replace('/%s/', ip(ma))
        .replace('/%s/', ipv(ma))
        .replace('/%s/', ip(ma))
        .replace('/%s/', port(ma).toString())
        ;
}
