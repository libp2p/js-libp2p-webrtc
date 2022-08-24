/* eslint-env mocha */

import tests from '@libp2p/interface-transport-compliance-tests';
import { multiaddr } from '@multiformats/multiaddr';
// import { WebRTCTransport } from '../src/transport.js';
import { Transport } from '@libp2p/interface-transport';

export default (create: () => Promise<Transport>) => {
  describe('WebRTCTransport setup', function () {
    this.timeout(20 * 1000);

    tests({
      async setup() {
        const ws = await create();

        const addrs = [
          multiaddr('/ip4/127.0.0.1/udp/2345/webrtc/certhash/uEiC5LhHPI__aMbu7XAqd2Q4gB-K7YS8flM_lLg4FXE6KiA/p2p/12D3KooWGDMwwqrpcYKpKCgxuKT2NfqPqa94QnkoBBpqvCaiCzWd'),
        ];

        // Used by the dial tests to simulate a delayed connect
        const connector = {
          delay() {},
          restore() {},
        };

        return { transport: ws, addrs, connector };
      },
      async teardown() {},
    });
  });
};
