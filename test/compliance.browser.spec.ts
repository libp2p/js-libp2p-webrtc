/* eslint-env mocha */

import complianceTests from './compliance';
import { WebRTCTransport } from '../src/transport';
import { CreateListenerOptions, Listener, Transport } from '@libp2p/interface-transport';
import { MockListener } from './util';

export function transportAsIs(): Transport {
  const t = new WebRTCTransport();
  return t;
}
export function transportWithStubbedCreateListener(): Transport {
  let t = new WebRTCTransport();
  t['createListener'] = (options: CreateListenerOptions): Listener => {
    console.log('TODO: mock listener?');
    return new MockListener();
  };
  return t;
}

describe('WebRTCTransport (partial) compliance testing', () => {
  const create = async () => {
    return transportWithStubbedCreateListener();
  };
  complianceTests(create);
});
