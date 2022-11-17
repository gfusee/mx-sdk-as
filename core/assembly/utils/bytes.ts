import {Constants} from "./constants";

export function bytesToSize(bytes: Uint8Array, size: i32): Uint8Array {
    if (bytes.length > size) {
      throw new Error(Constants.Errors.DECODE_BAD_ARRAY_LENGTH)
    } else if (bytes.length == size) {
      return bytes
    }

    const result = new Uint8Array(size)
    result.set(bytes, size - bytes.length)

    return result
}

export function areBytesEquals(bytes1: Uint8Array, bytes2: Uint8Array): boolean {
    if (bytes1.length != bytes2.length) {
        return false
    }

    for (let i = 0; i < bytes1.length; i++) {
        if (bytes1[i] != bytes2[i]) {
            return false
        }
    }

    return true
}