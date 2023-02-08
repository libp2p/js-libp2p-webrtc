// import { createLibp2p } from 'libp2p'
// import { webRTC, webRTCPeer } from '../src'
// import { webSockets } from '@libp2p/websockets'
// import * as filters from '@libp2p/websockets/filters'
// import { mplex } from '@libp2p/mplex'
// import { noise } from '@chainsafe/libp2p-noise'
// import { multiaddr } from '@multiformats/multiaddr'
// import pDefer from 'p-defer'
// import { pipe } from 'it-pipe'
// import { fromString } from 'uint8arrays/from-string'
// import { toString } from 'uint8arrays/to-string'
// import first from 'it-first'
// import { expect } from 'aegir/chai'

// describe.skip('test relay', () => {
//   it('can connect over ws relay', async () => {
//     const relayAddress = multiaddr('/ip4/192.168.1.101/tcp/4003/ws/p2p/QmceBZS6MN8uX4vvRdpTnu9Ga2uhHzRnVYLYPTnyWHkyHc')
//     const listener = await createLibp2p({
//       transports: [
//         webRTCPeer({}),
//         webSockets({
//           filter: filters.all
//         })
//       ],
//       streamMuxers: [mplex()],
//       connectionEncryption: [noise()],
//       relay: {
//         enabled: true,
//         autoRelay: {
//           enabled: true,
//           maxListeners: 2
//         }
//       }
//     })
//     const dialer = await createLibp2p({
//       transports: [
//         webRTCPeer({}),
//         webSockets({
//           filter: filters.all
//         })
//       ],
//       streamMuxers: [mplex()],
//       connectionEncryption: [noise()],
//       identify: {
//         timeout: 30000
//       }
//     })

//     await listener.start()
//     await dialer.start()

//     const relaying = pDefer<string>()
//     listener.peerStore.addEventListener('change:multiaddrs', (event) => {
//       const { peerId } = event.detail

//       // Updated self multiaddrs?
//       if (peerId.equals(listener.peerId)) {
//         const webrtcAddr = `${listener.getMultiaddrs()[0].toString()}/webrtc-peer/p2p/${peerId}`
//         relaying.resolve(webrtcAddr)
//       }
//     })

//     listener.handle('/echo/1.0.0', ({ stream }) => {
//       void pipe(stream, stream)
//     })

//     await listener.dial(relayAddress)
//     const dialAddr = multiaddr(await relaying.promise)
//     const stream = await dialer.dialProtocol(dialAddr, ['/echo/1.0.0'])
//     const input = fromString('test')
//     const output = await pipe(
//       [input],
//       stream,
//       async (source) => await first(source)
//     )
//     expect(toString(output!.subarray())).to.equals('test')
//     console.log('read data', output!.subarray())
//   })

//   it.only('can connect over webrtc relay', async () => {
//     const relayAddress = multiaddr('/ip4/192.168.1.101/udp/4004/webrtc/certhash/uEiBMYhADacrAg34fe9Vfj9cy6ZaNx5EqhLnWtol9zFvO5A/p2p/QmZxycy737ycr2vGWwT9HreJGAtNu3EGLAfwuGrMfBxVF4')
//     const listener = await createLibp2p({
//       transports: [
//         webRTCPeer({}),
//         webRTC()
//       ],
//       streamMuxers: [mplex()],
//       connectionEncryption: [noise()],
//       relay: {
//         enabled: true,
//         autoRelay: {
//           enabled: true,
//           maxListeners: 2
//         }
//       }
//     })
//     const dialer = await createLibp2p({
//       transports: [
//         webRTCPeer({}),
//         webRTC()
//       ],
//       streamMuxers: [mplex()],
//       connectionEncryption: [noise()],
//       relay: {
//         enabled: true
//       }
//     })

//     await listener.start()
//     await dialer.start()

//     const relaying = pDefer<string>()
//     listener.peerStore.addEventListener('change:multiaddrs', (event) => {
//       const { peerId } = event.detail

//       if (peerId.equals(listener.peerId)) {
//         const webrtcAddr = `${listener.getMultiaddrs()[0].toString()}/webrtc-peer/p2p/${peerId}`
//         relaying.resolve(webrtcAddr)
//       }
//     })

//     listener.handle('/echo/1.0.0', ({ stream }) => {
//       void pipe(stream, stream)
//     })

//     await listener.dial(relayAddress)
//     const addr = await relaying.promise
//     const dialAddr = multiaddr(addr)
//     const stream = await dialer.dialProtocol(dialAddr, ['/echo/1.0.0'])
//     const input = fromString('test')
//     const output = await pipe(
//       [input],
//       stream,
//       async (source) => await first(source)
//     )
//     expect(toString(output!.subarray())).to.equals('test')
//     console.log('read data', output!.subarray())
//   })
// })

describe('webrtc_direct handlers', () => {
    it('handles incoming connection', () => {

        
    })

})

export {}
