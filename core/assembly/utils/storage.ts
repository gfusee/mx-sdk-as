import { ElrondString } from "../types"
import {checkIfDebugBreakpointEnabled, enableSecondDebugBreakpoint, storageLoad, storageLoadLength} from "./env"

export function getBytesFromStorage(key: ElrondString): Uint8Array {
    const keyBytes = key.utils.toBytes()
    const keyBytesPtr = changetype<i32>(keyBytes.buffer)
    let storageLen = storageLoadLength(keyBytesPtr, keyBytes.byteLength)

    let bytesFromStorage = new Uint8Array(storageLen)

    if (storageLen > 0) {
        storageLoad(keyBytesPtr, keyBytes.byteLength, changetype<i32>(bytesFromStorage.buffer))
    }

    return bytesFromStorage
}