import { logger } from '@libp2p/logger'
import type { DeferredPromise } from 'p-defer'
import * as pb from './pb/index.js'

interface MessageStream {
  read: () => Promise<pb.Message>
  write: (d: pb.Message) => void | Promise<void>
}

const log = logger('libp2p:webrtc:peer:util')

export const readCandidatesUntilConnected = async (connectedPromise: DeferredPromise<any>, pc: RTCPeerConnection, stream: MessageStream) => {
  while (true) {
    const readResult = await Promise.race([connectedPromise.promise, stream.read()])
    // check if readResult is a message
    if (readResult instanceof Object) {
      const message = readResult
      if (message.type !== pb.Message.Type.ICE_CANDIDATE) {
        throw new Error('expected only ice candidates')
      }
      // end of candidates has been signalled
      if (message.data == null || message.data === '') {
        log.trace('end-of-candidates received')
        break
      }

      log.trace('received new ICE candidate: %s', message.data)
      await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data)))
    } else {
      // connected promise resolved
      break
    }
  }
  await connectedPromise.promise
}
export {}
