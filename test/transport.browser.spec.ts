import * as underTest from '../src/transport.js';
import { UnimplementedError } from '../src/error.js';
import { Components } from '@libp2p/components';
import { mockUpgrader } from '@libp2p/interface-mocks';
import { CreateListenerOptions, symbol } from '@libp2p/interface-transport';
import { Multiaddr } from '@multiformats/multiaddr';
import { expect } from 'chai';

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

    it('throws appropriate error when dialing someone without a peer ID', () => {
        let ma = new Multiaddr('/ip4/1.2.3.4/udp/1234/webrtc/certhash/m9DKgRTRiheDY13U2hHKOsqqecWTk604GUWRCZP4EqNA');
        let t = new underTest.WebRTCTransport();
        expect(t.dial(ma,ignoredDialOption())).to.throw();
    });
    
});
