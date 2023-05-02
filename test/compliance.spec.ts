/* eslint-env mocha */

import { multiaddr } from '@multiformats/multiaddr'
import tests from '@libp2p/interface-transport-compliance-tests'
import sinon from 'sinon'
import net from 'net'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'

import { webRTCDirect } from '../src/index.js'
import { WebRTCDirectTransportComponents } from '../src/transport.js'

describe('interface-transport compliance', () => {
  let components: WebRTCDirectTransportComponents

  before(async () => {
    components = {
      peerId: await createEd25519PeerId()
    }
  })

  tests({
    async setup () {
      const transport = webRTCDirect()(components)

      const addrs = [
        multiaddr('/ip4/127.0.0.1/udp/9091/webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/udp/9092/webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/udp/9093/webrtc-direct'),
        multiaddr('/ip4/127.0.0.1/udp/9094/webrtc-direct')
      ]

      // Used by the dial tests to simulate a delayed connect
      const connector = {
        delay (delayMs: number) {
          const netConnect = net.connect
          sinon.replace(net, 'connect', (opts: any) => {
            const socket = netConnect(opts)
            const socketEmit = socket.emit.bind(socket)
            sinon.replace(socket, 'emit', (...args: [string]) => {
              const time = args[0] === 'connect' ? delayMs : 0
              setTimeout(() => socketEmit(...args), time)
              return true
            })
            return socket
          })
        },
        restore () {
          sinon.restore()
        }
      }
      return { transport, addrs, connector }
    },
    async teardown () {}
  })
})
