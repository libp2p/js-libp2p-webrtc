import { expect } from 'aegir/chai'
import delay from 'delay'
import * as lengthPrefixed from 'it-length-prefixed'
import { bytes } from 'multiformats'
import { Message } from '../src/pb/message.js'
import { createStream } from '../src/stream'
import type { Stream } from '@libp2p/interface-connection'
const TEST_MESSAGE = 'test_message'

function setup (): { peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel, stream: Stream } {
  const peerConnection = new RTCPeerConnection()
  const dataChannel = peerConnection.createDataChannel('whatever', { negotiated: true, id: 91 })
  const stream = createStream({ channel: dataChannel, direction: 'outbound' })

  return { peerConnection, dataChannel, stream }
}

function generatePbByFlag (flag?: Message.Flag): Uint8Array {
  const buf = Message.encode({
    flag,
    message: bytes.fromString(TEST_MESSAGE)
  })

  return lengthPrefixed.encode.single(buf).subarray()
}

describe('Stream Stats', () => {
  let stream: Stream

  beforeEach(async () => {
    ({ stream } = setup())
  })

  it('can construct', () => {
    expect(stream.stat.timeline.close).to.not.exist()
  })

  it('close marks it closed', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.close()
    expect(stream.stat.timeline.close).to.be.a('number')
  })

  it('closeRead marks it read-closed only', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.closeRead()
    expect(stream.stat.timeline.close).to.not.exist()
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })

  it('closeWrite marks it write-closed only', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.closeWrite()
    expect(stream.stat.timeline.close).to.not.exist()
    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })

  it('closeWrite AND closeRead = close', async () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.closeWrite()
    stream.closeRead()
    expect(stream.stat.timeline.close).to.be.a('number')
    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })

  it('abort = close', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.abort(new Error('Oh no!'))
    expect(stream.stat.timeline.close).to.be.a('number')
    expect(stream.stat.timeline.close).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })

  it('reset = close', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    stream.reset() // only resets the write side
    expect(stream.stat.timeline.close).to.be.a('number')
    expect(stream.stat.timeline.close).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })
})

describe('Stream Read Stats Transition By Incoming Flag', () => {
  let dataChannel: RTCDataChannel
  let stream: Stream

  beforeEach(async () => {
    ({ dataChannel, stream } = setup())
  })

  it('no flag, no transition', () => {
    expect(stream.stat.timeline.close).to.not.exist()
    const data = generatePbByFlag()
    dataChannel.onmessage?.(new MessageEvent('message', { data }))

    expect(stream.stat.timeline.close).to.not.exist()
  })

  it('open to read-close by flag:FIN', async () => {
    const data = generatePbByFlag(Message.Flag.FIN)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.stat.timeline.closeWrite).to.not.exist()
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })

  it('read-close to close by flag:STOP_SENDING', async () => {
    const data = generatePbByFlag(Message.Flag.STOP_SENDING)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeRead).to.not.exist()
  })
})

describe('Stream Write Stats Transition By Incoming Flag', () => {
  let dataChannel: RTCDataChannel
  let stream: Stream

  beforeEach(async () => {
    ({ dataChannel, stream } = setup())
  })

  it('open to write-close by flag:STOP_SENDING', async () => {
    const data = generatePbByFlag(Message.Flag.STOP_SENDING)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.stat.timeline.closeWrite).to.be.greaterThanOrEqual(stream.stat.timeline.open)
    expect(stream.stat.timeline.closeRead).to.not.exist()
  })

  it('write-close to close by flag:FIN', async () => {
    const data = generatePbByFlag(Message.Flag.FIN)
    dataChannel.dispatchEvent(new MessageEvent('message', { data }))

    await delay(100)

    expect(stream.stat.timeline.closeWrite).to.not.exist()
    expect(stream.stat.timeline.closeRead).to.be.greaterThanOrEqual(stream.stat.timeline.open)
  })
})
