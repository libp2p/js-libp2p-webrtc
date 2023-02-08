import { mockConnection, mockMultiaddrConnection, mockStream } from '@libp2p/interface-mocks'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import { expect } from 'aegir/chai'
import { pair } from 'it-pair'
import { duplexPair } from 'it-pair/duplex'
import { pbStream } from 'it-pb-stream'
import { connect, handleIncomingStream } from '../src/peer_transport/handler'
import { Message } from '../src/peer_transport/pb/index.js'

describe('webrtc direct basic', () => {
  it('should connect', async () => {
    const [receiver, initiator] = duplexPair<any>()
    const dstPeerId = await createEd25519PeerId()
    const connection = mockConnection(
      mockMultiaddrConnection(pair<any>(), dstPeerId)
    )
    const controller = new AbortController()
    const initiatorPeerConnectionPromise = connect({ stream: mockStream(initiator), signal: controller.signal })
    const receiverPeerConnectionPromise = handleIncomingStream({ stream: mockStream(receiver), connection })
    await expect(initiatorPeerConnectionPromise).to.be.fulfilled()
    await expect(receiverPeerConnectionPromise).to.be.fulfilled()
    const [pc0, pc1] = await Promise.all([initiatorPeerConnectionPromise, receiverPeerConnectionPromise])
    expect(pc0.connectionState).eq('connected')
    expect(pc1.connectionState).eq('connected')
  })
})

describe('webrtc direct receiver', () => {
  it('should fail receiving on invalid sdp answer', async () => {
    const [receiver, initiator] = duplexPair<any>()
    const dstPeerId = await createEd25519PeerId()
    const connection = mockConnection(
      mockMultiaddrConnection(pair<any>(), dstPeerId)
    )
    const receiverPeerConnectionPromise = handleIncomingStream({ stream: mockStream(receiver), connection })
    const stream = pbStream(initiator).pb(Message)
    const offerSDP = await stream.read()
    expect(offerSDP.data).to.not.be.undefined()
    expect(offerSDP.type).to.eq(Message.Type.SDP_OFFER)
    // check SDP
    {
      const pc = new RTCPeerConnection()
      const offer = new RTCSessionDescription({ type: 'offer', sdp: offerSDP.data })
      await expect(pc.setRemoteDescription(offer)).to.be.fulfilled()
    }

    stream.write({ type: Message.Type.SDP_ANSWER, data: 'bad' })
    await expect(receiverPeerConnectionPromise).to.be.rejectedWith(/Failed to execute 'setRemoteDescription'/)
  })

  it('should fail on receiving candidate before answer', async () => {
    const [receiver, initiator] = duplexPair<any>()
    const dstPeerId = await createEd25519PeerId()
    const connection = mockConnection(
      mockMultiaddrConnection(pair<any>(), dstPeerId)
    )
    const receiverPeerConnectionPromise = handleIncomingStream({ stream: mockStream(receiver), connection })
    const stream = pbStream(initiator).pb(Message)
    const offerSDP = await stream.read()
    expect(offerSDP.data).to.not.be.undefined()
    expect(offerSDP.type).to.eq(Message.Type.SDP_OFFER)
    // check SDP
    {
      const pc = new RTCPeerConnection()
      const offer = new RTCSessionDescription({ type: 'offer', sdp: offerSDP.data })
      await expect(pc.setRemoteDescription(offer)).to.be.fulfilled()
      // set up a callback to write a candidate
      pc.onicecandidate = ({ candidate }) => {
        stream.write({
          type: Message.Type.ICE_CANDIDATE,
          data: (candidate != null) ? JSON.stringify(candidate) : ''
        })
      }
      // set the answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
    }

    await expect(receiverPeerConnectionPromise).to.be.rejectedWith(/expected message type SDP_ANSWER/)
  })

  it('should fail on receiving invalid candidate', async () => {
    const [receiver, initiator] = duplexPair<any>()
    const dstPeerId = await createEd25519PeerId()
    const connection = mockConnection(
      mockMultiaddrConnection(pair<any>(), dstPeerId)
    )
    const receiverPeerConnectionPromise = handleIncomingStream({ stream: mockStream(receiver), connection })
    const stream = pbStream(initiator).pb(Message)
    const offerSDP = await stream.read()
    expect(offerSDP.data).to.not.be.undefined()
    expect(offerSDP.type).to.eq(Message.Type.SDP_OFFER)
    // check SDP
    {
      const pc = new RTCPeerConnection()
      const offer = new RTCSessionDescription({ type: 'offer', sdp: offerSDP.data })
      await expect(pc.setRemoteDescription(offer)).to.be.fulfilled()
      // create the answer
      const answer = await pc.createAnswer()
      // write the answer
      stream.write({ type: Message.Type.SDP_ANSWER, data: answer.sdp })
      // set answer as local description
      await pc.setLocalDescription(answer)
      // send broken candidate
      stream.write({
        type: Message.Type.ICE_CANDIDATE,
        data: 'bad candidate'
      })
    }

    await expect(receiverPeerConnectionPromise).to.be.rejectedWith(/bad candidate/)
  })
})

describe('webrtc direct dialer', () => {
  it('should fail on invalid sdp offer', async () => {
    const [receiver, initiator] = duplexPair<any>()
    const controller = new AbortController()
    const initiatorPeerConnectionPromise = connect({ stream: mockStream(initiator), signal: controller.signal })
    const stream = pbStream(receiver).pb(Message)
    stream.write({ type: Message.Type.SDP_OFFER, data: 'bad' })
    await expect(initiatorPeerConnectionPromise).to.be.rejectedWith(/Failed to execute 'setRemoteDescription'/)
  })
})

export { }
