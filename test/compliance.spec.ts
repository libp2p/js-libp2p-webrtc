/* eslint-env mocha */

import { mockRegistrar, mockUpgrader } from '@libp2p/interface-mocks'
import tests from '@libp2p/interface-transport-compliance-tests'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { multiaddr } from '@multiformats/multiaddr'
import sinon from 'sinon'
import { stubInterface } from 'sinon-ts'
import { webRTC } from '../src/index.js'
import type { WebRTCTransportComponents } from '../src/private-to-private/transport.js'
import type { Ed25519PeerId } from '@libp2p/interface-peer-id'
import type { TransportManager } from '@libp2p/interface-transport'

describe('interface-transport compliance', () => {
  let components: WebRTCTransportComponents

  let relayPeerId: Ed25519PeerId

  before(async () => {
    relayPeerId = await createEd25519PeerId()
    components = {
      peerId: relayPeerId,
      registrar: mockRegistrar(),
      upgrader: mockUpgrader(),
      transportManager: stubInterface<TransportManager>()
    }
  })

  tests({
    async setup () {
      const transport = webRTC()(components)

      const browserPeerId = await createEd25519PeerId()

      const addrs = [
        multiaddr(`/ip4/127.0.0.1/udp/9091/certhash/uEiAUqV7kzvM1wI5DYDc1RbcekYVmXli_Qprlw3IkiEg6tQ/p2p/${relayPeerId.toString()}/p2p-circuit/webrtc/p2p/${browserPeerId.toString()}`)
      ]

      // Used by the dial tests to simulate a delayed connect
      const connector = {
        delay () {},
        restore () {
          sinon.restore()
        }
      }
      return { transport, addrs, connector }
    },
    async teardown () {}
  })
})
