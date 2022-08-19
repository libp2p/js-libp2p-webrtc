// import { createConnectedRTCPeerConnectionPair } from './util.js';
import * as underTest from '../src/transport.js';
import * as sdpUtil from '../src/sdp.js';
import { UnimplementedError } from '../src/error.js';
import { Components } from '@libp2p/components';
import { mockUpgrader } from '@libp2p/interface-mocks';
import { CreateListenerOptions, symbol } from '@libp2p/interface-transport';
import { Multiaddr } from '@multiformats/multiaddr';
import { expect } from 'chai';
import * as logging from '@libp2p/logger';
import * as multihashes from 'multihashes';
import type { HashName } from 'multihashes';
import { base64url } from 'multiformats/bases/base64';
import { peerIdFromString } from '@libp2p/peer-id';

function ignoredDialOption(): CreateListenerOptions {
    let u = mockUpgrader({});
    return {
        upgrader: u
    };
}

describe('basic transport tests', () => {

    it('Can construct', () => {
        let t = new underTest.WebRTCTransport();
        expect(t.constructor.name).to.equal('WebRTCTransport');
    });
    
    it('init does not throw', () => {
        let t = new underTest.WebRTCTransport();
        t.init(new Components());
    });
        
    it('createListner does throw', () => {
        let t = new underTest.WebRTCTransport();
        try {
            t.createListener(ignoredDialOption());
            expect('Should have thrown').to.equal('but did not');
        } catch (e) {
            expect(e).to.be.instanceOf(UnimplementedError);
        }
    });

    it('toString includes the toStringTag', () => {
        let t = new underTest.WebRTCTransport();
        let s = t.toString();
        expect(s).to.contain('@libp2p/webrtc');
    });
    
    it('toString property getter', () => {
        let t = new underTest.WebRTCTransport();
        let s = t[Symbol.toStringTag];
        expect(s).to.equal('@libp2p/webrtc');
    });
    
    it('symbol property getter', () => {
        let t = new underTest.WebRTCTransport();
        let s = t[symbol];
        expect(s).to.equal(true);
    });

    it('filter gets rid of some invalids and returns a valid', async () => {
        let mas: Multiaddr[] = [
            '/ip4/1.2.3.4/udp/1234/webrtc/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ',
            '/ip4/1.2.3.4/udp/1234/webrtc/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd',
            '/ip4/1.2.3.4/udp/1234/webrtc/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd',
            '/ip4/1.2.3.4/udp/1234/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd'
            ].map((s) => {return new Multiaddr(s);});
        let t = new underTest.WebRTCTransport();
        let result = t.filter(mas);
        let expected: Multiaddr[] = [ new Multiaddr('/ip4/1.2.3.4/udp/1234/webrtc/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd') ];
        expect(result).to.not.be.null();
        expect(result.constructor.name).to.equal('Array');
        expect(expected.constructor.name).to.equal('Array');
        expect(result).to.eql(expected);
    });

    it('throws appropriate error when dialing someone without a peer ID', async () => {
        let ma = new Multiaddr('/ip4/1.2.3.4/udp/1234/webrtc/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ');
        let t = new underTest.WebRTCTransport();
        try {
            let conn = await t.dial(ma,ignoredDialOption());
            expect(conn.toString()).to.equal('Should have thrown');
        } catch (e) {
            expect(e).to.be.instanceOf(Error);
            if (e instanceof Error) {
                // let err: Error = e;
                expect(e.message).to.contain('PeerId');
            }
        }
    });
    
    it('probably more setup needed', async (done) => {
        logging.enable('libp2p:webrtc:transport');
        let t = new underTest.WebRTCTransport();
        let c = new Components();
        c.setPeerId(peerIdFromString('12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd'));
        t.init( c );
        // let [_,server] = await createConnectedRTCPeerConnectionPair();
        let server = new RTCPeerConnection();
        let ufrag = '90f32a75-0ec8-4f45-a631-cb7366fc7fa1';
        let serverSdp = await server.createAnswer();
        let munged = sdpUtil.munge(serverSdp, ufrag);
        if (!munged || !(munged.sdp)) {
            throw 3;
        }
        server.setLocalDescription(munged);
        expect(server.currentLocalDescription).to.not.be.null();
        if (!server.currentLocalDescription) {
            throw 2;
        }
        console.log('\nSDP=%s\n', munged.sdp.replaceAll('\r',' '));
        let desc = munged
            .sdp
            .split("\n")
            .map(line => line.split('=').map((s) => s.trim()))
            .filter(([k,_]) => k);
        expect(desc).to.not.be.null();
        if (!desc) {
            throw 0;
        }
        let h = new Map<string,string>();
        for ( const kv of desc ) {
            let [ key, value ] = kv;
            // console.log('key(%s)=value(%s)\n', key, value );
            if (key == 'a') {
                let a = value.split(':');
                h.set( a[0], a.slice(1).join(':') );
            } else {
                h.set( key, value );
            }
        }
        let ip = h.get('o')?.split(' ')[5];
        expect(ip).to.not.be.null();
        let port = h.get('candidate')?.split(' ')[5];
        expect(port).to.not.be.null();
        let fp = h.get('fingerprint')?.split(' ');
        if (!(ip && port && fp)) {
            throw 1;
        }
        expect(ip.length).to.be.lessThanOrEqual(15);
        expect(ip.length).to.be.greaterThanOrEqual(7);
        // let hashName = fp[0];
        let hashName: HashName = "sha2-256";
        let digest = new Uint8Array( fp[1].split(':').map( (bx) => parseInt(bx, 16)) );
        let certHash = base64url.encode( multihashes.encode(digest, hashName) );
        let mas = 
            '/ip4/' + ip + 
            '/udp/' + port + 
            '/webrtc/certhash/' + certHash +
            '/p2p/' + (await t.getPeerId()).toString()
            ;
        console.log('\n\n%s -> %s ... %s', fp[1], digest.toString(), certHash.toString());
        console.log('port=%s ip=%s ma=%s\n', port, ip, mas);
        let ma = new Multiaddr(mas);
        let conn = await t.dial(ma,{
                ...ignoredDialOption(),
                ufrag: ufrag
            });
        expect(conn.toString()).to.equal('Hey, dude, we got here!');
        done();
    }).timeout(98765);
    
});
