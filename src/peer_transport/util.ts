import type { DeferredPromise } from "p-defer"
import * as pb from './pb/index.js'

type MessageStream = {
    read: () => Promise<pb.Message>,
    write: (d: pb.Message) => void | Promise<void>
};
export const readCandidatesUntilConnected = async (connectedPromise: DeferredPromise<void>, pc: RTCPeerConnection, stream: MessageStream) => {
    while (true) {
        const readResult = await Promise.race([connectedPromise.promise, stream.read()])
        // check if readResult is a message
        if (readResult instanceof Object) {
            const message = readResult as pb.Message
            if (message.type !== pb.Message.Type.ICE_CANDIDATE) {
                throw new Error('expected only ice candidates')
            }
            // end of candidates has been signalled
            if (message.data == null || message.data === '') {
                break
            }
            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data)))
        } else {
            // connected promise resolved
            break
        }
    }
    await connectedPromise
}
export {}