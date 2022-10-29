import { WireType } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf enum webrtc.pb.Message.Flag
 */
export var Message_Flag;
(function (Message_Flag) {
    /**
     * The sender will no longer send messages on the stream.
     *
     * @generated from protobuf enum value: FIN = 0;
     */
    Message_Flag[Message_Flag["FIN"] = 0] = "FIN";
    /**
     * The sender will no longer read messages on the stream. Incoming data is
     * being discarded on receipt.
     *
     * @generated from protobuf enum value: STOP_SENDING = 1;
     */
    Message_Flag[Message_Flag["STOP_SENDING"] = 1] = "STOP_SENDING";
    /**
     * The sender abruptly terminates the sending part of the stream. The
     * receiver can discard any data that it already received on that stream.
     *
     * @generated from protobuf enum value: RESET = 2;
     */
    Message_Flag[Message_Flag["RESET"] = 2] = "RESET";
})(Message_Flag || (Message_Flag = {}));
// @generated message type with reflection information, may provide speed optimized methods
class Message$Type extends MessageType {
    constructor() {
        super("webrtc.pb.Message", [
            { no: 1, name: "flag", kind: "enum", opt: true, T: () => ["webrtc.pb.Message.Flag", Message_Flag] },
            { no: 2, name: "message", kind: "scalar", opt: true, T: 12 /*ScalarType.BYTES*/ }
        ]);
    }
    create(value) {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* optional webrtc.pb.Message.Flag flag */ 1:
                    message.flag = reader.int32();
                    break;
                case /* optional bytes message */ 2:
                    message.message = reader.bytes();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* optional webrtc.pb.Message.Flag flag = 1; */
        if (message.flag !== undefined)
            writer.tag(1, WireType.Varint).int32(message.flag);
        /* optional bytes message = 2; */
        if (message.message !== undefined)
            writer.tag(2, WireType.LengthDelimited).bytes(message.message);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message webrtc.pb.Message
 */
export const Message = new Message$Type();
//# sourceMappingURL=message.js.map