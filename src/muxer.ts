import type { Stream } from '@libp2p/interface-connection'
import type { StreamMuxer, StreamMuxerFactory, StreamMuxerInit } from '@libp2p/interface-stream-muxer'
import type { Source, Sink } from 'it-stream-types'

import { WebRTCStream } from './stream.js'
import { nopSink, nopSource } from './util.js'

export class DataChannelMuxerFactory implements StreamMuxerFactory {
  /**
   * WebRTC Peer Connection
   */
  private readonly peerConnection: RTCPeerConnection

  constructor (peerConnection: RTCPeerConnection, readonly protocol = '/webrtc') {
    this.peerConnection = peerConnection
    // reject any datachannels as the muxer is not yet ready to process
    // streams
    this.peerConnection.ondatachannel = ({ channel }) => {
      channel.close()
    }
  }

  createStreamMuxer (init?: StreamMuxerInit | undefined): StreamMuxer {
    return new DataChannelMuxer(this.peerConnection, this.protocol, init)
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
  source: Source<Uint8Array> = nopSource;

  /**
   * The stream destination, a no-op as the transport natively supports multiplexing
   */
  sink: Sink<Uint8Array, Promise<void>> = nopSink;

  constructor (peerConnection: RTCPeerConnection, readonly protocol = '/webrtc', init?: StreamMuxerInit) {
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
        init.onIncomingStream(stream)
      }
    }
  }

  newStream (): Stream {
    // The spec says the label SHOULD be an empty string: https://github.com/libp2p/specs/blob/master/webrtc/README.md#rtcdatachannel-label
    const channel = this.peerConnection.createDataChannel('')
    const stream = new WebRTCStream({
      channel,
      stat: {
        direction: 'outbound',
        timeline: {
          open: 0
        }
      },
      closeCb: this.init?.onStreamEnd
    })

    return stream
  }
}
