import { AbstractStream, type AbstractStreamInit } from '@libp2p/interface-stream-muxer/stream'
import { CodeError } from '@libp2p/interfaces/errors'
import { logger } from '@libp2p/logger'
import * as lengthPrefixed from 'it-length-prefixed'
import { type Pushable, pushable } from 'it-pushable'
import { Uint8ArrayList } from 'uint8arraylist'
import { Message } from './pb/message.js'
import type { Direction, Stream } from '@libp2p/interface-connection'

const log = logger('libp2p:webrtc:stream')

const MAX_MSG_SIZE = 16 * 1024

export interface WebRTCStreamInit extends AbstractStreamInit {
  /**
   * The network channel used for bidirectional peer-to-peer transfers of
   * arbitrary data
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
   */
  channel: RTCDataChannel
}

class WebRTCStream extends AbstractStream {
  /**
   * The data channel used to send and receive data
   */
  private readonly channel: RTCDataChannel

  /**
   * push data from the underlying datachannel to the length prefix decoder
   * and then the protobuf decoder.
   */
  private readonly incomingData: Pushable<Uint8Array>

  private messageQueue: Uint8ArrayList[]

  constructor (init: WebRTCStreamInit) {
    super(init)

    this.channel = init.channel
    this.channel.binaryType = 'arraybuffer'
    this.incomingData = pushable()
    this.messageQueue = []

    // set up initial state
    switch (this.channel.readyState) {
      case 'open':
        break

      case 'closed':
      case 'closing':
        if (this.stat.timeline.close === undefined || this.stat.timeline.close === 0) {
          this.stat.timeline.close = Date.now()
        }
        break
      case 'connecting':
        // noop
        break

      default:
        log.error('unknown datachannel state %s', this.channel.readyState)
        throw new CodeError('Unknown datachannel state', 'ERR_INVALID_STATE')
    }

    // handle RTCDataChannel events
    this.channel.onopen = (_evt) => {
      this.stat.timeline.open = new Date().getTime()

      // send any queued messages
      this.messageQueue.forEach(list => {
        this.channel.send(list.subarray())
      })
      this.messageQueue = []
    }

    this.channel.onclose = (_evt) => {
      this.close()
    }

    this.channel.onerror = (evt) => {
      const err = (evt as RTCErrorEvent).error
      this.abort(err)
    }

    const self = this

    this.channel.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
      const { data } = event

      if (data === null || data.byteLength === 0) {
        return
      }

      this.incomingData.push(new Uint8Array(data, 0, data.byteLength))
    }

    // pipe framed protobuf messages through a length prefixed decoder, and
    // surface data from the `Message.message` field through a source.
    Promise.resolve().then(async () => {
      for await (const buf of lengthPrefixed.decode(this.incomingData)) {
        const message = self.processIncomingProtobuf(buf.subarray())

        if (message != null) {
          self.sourcePush(new Uint8ArrayList(message))
        }
      }
    })
      .catch(err => {
        log.error('error processing incoming data channel messages', err)
      })
  }

  sendNewStream (): void {
    // opening new streams is handled by WebRTC so this is a noop
  }

  sendData (data: Uint8ArrayList): void {
    if (this.channel.readyState === 'closed' || this.channel.readyState === 'closing') {
      throw new CodeError('Invalid datachannel state - closed or closing', 'ERR_INVALID_STATE')
    }

    const msgbuf = Message.encode({ message: data.subarray() })
    const sendbuf = lengthPrefixed.encode.single(msgbuf)

    if (this.channel.readyState === 'open') {
      // send message straight away
      this.channel.send(sendbuf.subarray())
    } else if (this.channel.readyState === 'connecting') {
      // queue message for when we are open
      this.messageQueue.push(sendbuf)
    } else {
      log.error('unknown datachannel state %s', this.channel.readyState)
      throw new CodeError('Unknown datachannel state', 'ERR_INVALID_STATE')
    }
  }

  sendReset (): void {
    this._sendFlag(Message.Flag.RESET)
  }

  sendCloseWrite (): void {
    this._sendFlag(Message.Flag.FIN)
  }

  sendCloseRead (): void {
    this._sendFlag(Message.Flag.STOP_SENDING)
  }

  /**
   * Handle incoming
   */
  private processIncomingProtobuf (buffer: Uint8Array): Uint8Array | undefined {
    const message = Message.decode(buffer)

    if (message.flag !== undefined) {
      if (message.flag === Message.Flag.FIN) {
        // We should expect no more data from the remote, stop reading
        this.incomingData.end()
        this.closeRead()
      }

      if (message.flag === Message.Flag.RESET) {
        // Stop reading and writing to the stream immediately
        this.reset()
      }

      if (message.flag === Message.Flag.STOP_SENDING) {
        // The remote has stopped reading
        this.closeWrite()
      }
    }

    return message.message
  }

  private _sendFlag (flag: Message.Flag): void {
    try {
      log.trace('Sending flag: %s', flag.toString())
      const msgbuf = Message.encode({ flag })
      this.channel.send(lengthPrefixed.encode.single(msgbuf).subarray())
    } catch (err) {
      if (err instanceof Error) {
        log.error(`Exception while sending flag ${flag}: ${err.message}`)
      }
    }
  }
}

export interface WebRTCStreamOptions {
  /**
   * The network channel used for bidirectional peer-to-peer transfers of
   * arbitrary data
   *
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel}
   */
  channel: RTCDataChannel

  /**
   * The stream direction
   */
  direction: Direction

  maxMsgSize?: number

  onEnd?: (err?: Error | undefined) => void
}

export function createStream (options: WebRTCStreamOptions): Stream {
  const { channel, direction, onEnd, maxMsgSize = MAX_MSG_SIZE } = options

  return new WebRTCStream({
    id: direction === 'inbound' ? (`i${channel.id}`) : `r${channel.id}`,
    direction,
    maxDataSize: maxMsgSize,
    onEnd,
    channel
  })
}
