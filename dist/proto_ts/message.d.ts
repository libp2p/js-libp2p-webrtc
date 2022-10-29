import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message webrtc.pb.Message
 */
export interface Message {
    /**
     * @generated from protobuf field: optional webrtc.pb.Message.Flag flag = 1;
     */
    flag?: Message_Flag;
    /**
     * @generated from protobuf field: optional bytes message = 2;
     */
    message?: Uint8Array;
}
/**
 * @generated from protobuf enum webrtc.pb.Message.Flag
 */
export declare enum Message_Flag {
    /**
     * The sender will no longer send messages on the stream.
     *
     * @generated from protobuf enum value: FIN = 0;
     */
    FIN = 0,
    /**
     * The sender will no longer read messages on the stream. Incoming data is
     * being discarded on receipt.
     *
     * @generated from protobuf enum value: STOP_SENDING = 1;
     */
    STOP_SENDING = 1,
    /**
     * The sender abruptly terminates the sending part of the stream. The
     * receiver can discard any data that it already received on that stream.
     *
     * @generated from protobuf enum value: RESET = 2;
     */
    RESET = 2
}
declare class Message$Type extends MessageType<Message> {
    constructor();
    create(value?: PartialMessage<Message>): Message;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Message): Message;
    internalBinaryWrite(message: Message, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message webrtc.pb.Message
 */
export declare const Message: Message$Type;
export {};
//# sourceMappingURL=message.d.ts.map