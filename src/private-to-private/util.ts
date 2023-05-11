import { logger } from '@libp2p/logger'
import { isFirefox } from '../util.js'
import { Message } from './pb/message.js'
import type { DeferredPromise } from 'p-defer'

interface MessageStream {
  read: () => Promise<Message>
  write: (d: Message) => void | Promise<void>
}

const log = logger('libp2p:webrtc:peer:util')

export const readCandidatesUntilConnected = async (connectedPromise: DeferredPromise<void>, pc: RTCPeerConnection, stream: MessageStream): Promise<void> => {
  while (true) {
    const readResult = await Promise.race([connectedPromise.promise, stream.read()])
    // check if readResult is a message
    if (readResult instanceof Object) {
      const message = readResult
      if (message.type !== Message.Type.ICE_CANDIDATE) {
        throw new Error('expected only ice candidates')
      }
      // end of candidates has been signalled
      if (message.data == null || message.data === '') {
        log.trace('end-of-candidates received')
        break
      }

      log.trace('received new ICE candidate: %s', message.data)
      try {
        await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data)))
      } catch (err) {
        log.error('bad candidate received: ', err)
        throw new Error('bad candidate received')
      }
    } else {
      // connected promise resolved
      break
    }
  }
  await connectedPromise.promise
}

export function resolveOnConnected (pc: RTCPeerConnection, promise: DeferredPromise<void>): void {
  pc[isFirefox ? 'oniceconnectionstatechange' : 'onconnectionstatechange'] = (_) => {
    log.trace('receiver peerConnectionState state: ', pc.connectionState)
    switch (isFirefox ? pc.iceConnectionState : pc.connectionState) {
      case 'connected':
        promise.resolve()
        break
      case 'failed':
      case 'disconnected':
      case 'closed':
        promise.reject(new Error('RTCPeerConnection was closed'))
        break
      default:
        break
    }
  }
}
