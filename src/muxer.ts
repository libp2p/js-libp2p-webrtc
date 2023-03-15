import type { Stream } from '@libp2p/interface-connection'
import type { CounterGroup } from '@libp2p/interface-metrics'
import type { StreamMuxer, StreamMuxerFactory, StreamMuxerInit } from '@libp2p/interface-stream-muxer'
import type { Source, Sink } from 'it-stream-types'

import { WebRTCStream } from './stream.js'
import { nopSink, nopSource } from './util.js'

export interface DataChannelMuxerFactoryInit {
  peerConnection: RTCPeerConnection
  metrics?: CounterGroup
}

export class DataChannelMuxerFactory implements StreamMuxerFactory {
  /**
   * WebRTC Peer Connection
   */
  private readonly peerConnection: RTCPeerConnection

  /**
   * Optional metrics counter group for all incoming/outgoing mux events.
   */
  private readonly metrics?: CounterGroup

  /**
   * The string representation of the protocol, required by `StreamMuxerFactory`
   */
  protocol: string = '/webrtc'

  constructor (init: DataChannelMuxerFactoryInit) {
    const { metrics, peerConnection } = init
    this.peerConnection = peerConnection
    if (metrics != null) {
      this.metrics = metrics
    }
  }

  createStreamMuxer (init?: StreamMuxerInit | undefined): StreamMuxer {
    return new DataChannelMuxer(this.peerConnection, this.metrics, init)
  }
}

/**
 * A libp2p data channel stream muxer
 */
export class DataChannelMuxer implements StreamMuxer {
  /**
   * WebRTC Peer Connection
   */
  private readonly peerConnection: RTCPeerConnection

  /**
   * Optional metrics for this data channel muxer
   */
  private readonly metrics?: CounterGroup

  /**
   * The protocol as represented in the multiaddress
   */
  readonly protocol: string = '/webrtc'

  /**
   * Array of streams in the data channel
   */
  streams: Stream[] = []

  /**
   * Initialized stream muxer
   */
  init?: StreamMuxerInit

  /**
   * Close or abort all tracked streams and stop the muxer
   */
  close: (err?: Error | undefined) => void = () => {}

  /**
   * The stream source, a no-op as the transport natively supports multiplexing
   */
  source: Source<Uint8Array> = nopSource

  /**
   * The stream destination, a no-op as the transport natively supports multiplexing
   */
  sink: Sink<Uint8Array, Promise<void>> = nopSink

  constructor (peerConnection: RTCPeerConnection, metrics?: CounterGroup, init?: StreamMuxerInit) {
    /**
     * Initialized stream muxer
     */
    this.init = init

    /**
     * WebRTC Peer Connection
     */
    this.peerConnection = peerConnection

    /**
     * Fired when a data channel has been added to the connection has been
     * added by the remote peer.
     *
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/datachannel_event}
     */
    this.peerConnection.ondatachannel = ({ channel }) => {
      const stream = new WebRTCStream({
        channel,
        stat: {
          direction: 'inbound',
          timeline: {
            open: 0
          }
        },
        closeCb: init?.onStreamEnd
      })

      if ((init?.onIncomingStream) != null) {
        this.metrics?.increment({ incoming_stream: true })
        init.onIncomingStream(stream)
      }
    }
  }

  newStream (): Stream {
    // The spec says the label SHOULD be an empty string: https://github.com/libp2p/specs/blob/master/webrtc/README.md#rtcdatachannel-label
    const channel = this.peerConnection.createDataChannel('')
    const closeCb = (stream: WebRTCStream): void => {
      this.metrics?.increment({ stream_end: true })
      this.init?.onStreamEnd?.(stream)
    }
    const stream = new WebRTCStream({
      channel,
      stat: {
        direction: 'outbound',
        timeline: {
          open: 0
        }
      },
      closeCb
    })

    return stream
  }
}
