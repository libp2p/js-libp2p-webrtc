import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from "it-pipe";
import { fromString, toString } from "uint8arrays";
import { webRTCDirect } from 'js-libp2p-webrtc'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { pushable } from 'it-pushable';
import { mplex } from '@libp2p/mplex'
import { createLibp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';

let stream;
const output = document.getElementById('output')
const sendSection = document.getElementById('send-section')
const appendOutput = (line) => {
  const div = document.createElement("div")
  div.appendChild(document.createTextNode(line))
  output.append(div)
}
const clean = (line) => line.replaceAll('\n', '')
const sender = pushable()

const node = await createLibp2p({
  transports: [
    webSockets({
      filter: filters.all,
    }),
    webRTCDirect({}),
  ],
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  relay: {
    enabled: true,
    autoRelay: {
      enabled: true,
    },
  },
})

await node.start()

// handle the echo protocol
await node.handle('/echo/1.0.0', ({ stream, connection }) => {
  console.log(stream)
  void pipe(stream, stream)
})

node.peerStore.addEventListener('change:multiaddrs', (event) => {
  const { peerId } = event.detail
  if (node.getMultiaddrs().length === 0 || !node.peerId.equals(peerId)) {
    return
  }
  node.getMultiaddrs().forEach((ma) => {
    if (ma.protoCodes().includes(290)) {
      const webrtcDirectAddress = ma.encapsulate(multiaddr(`/p2p-webrtc-direct/p2p/${node.peerId}`))
      appendOutput(`Listening on ${webrtcDirectAddress}`)
      sendSection.style.display = 'block'
    }
  })
})

window.connect.onclick = async () => {
  const ma = multiaddr(window.peer.value)
  appendOutput(`Dialing '${ma}'`)
  const connection = await node.dial(ma)
  console.log('dial completed')
  stream = await connection.newStream(['/echo/1.0.0'])
  pipe(sender, stream, async (src) => {
    for await(const buf of src) {
      const response = toString(buf.subarray())
      appendOutput(`Received message '${clean(response)}'`)
    }
  })
  console.log('stream', stream)
}

window.send.onclick = async () => {
  const message = `${window.message.value}\n`
  appendOutput(`Sending message '${clean(message)}'`)
  sender.push(fromString(message))
}
