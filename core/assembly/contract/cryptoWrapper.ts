import {ManagedBuffer, ManagedU32} from "../types";
import {bytesToSize} from "../utils/bytes";
import {verifyEd25519} from "../utils/env";

export class CryptoWrapper {

    verifyEd25519LegacyManaged(
        maxMessageLength: ManagedU32,
        key: ManagedBuffer,
        message: ManagedBuffer,
        signature: ManagedBuffer
    ): boolean {
        const keyBytes = bytesToSize(key.utils.toBytes(), 32)
        const messageByteSlice = bytesToSize(message.utils.toBytes(), maxMessageLength.value)
        const sigBytes = bytesToSize(signature.utils.toBytes(), 64)

        return verifyEd25519(
            changetype<i32>(keyBytes.buffer),
            changetype<i32>(messageByteSlice.buffer),
            messageByteSlice.byteLength,
            changetype<i32>(sigBytes.buffer)
        ) == 0
    }

}
