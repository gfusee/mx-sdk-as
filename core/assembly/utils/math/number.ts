import {ManagedBuffer, ManagedAddress} from "../../types";

export function u8ArrayToU32(array: Uint8Array): u32 {
    for (let i = 4; i < array.length; i++) {
        if (array[i] != 0) {
            assert(false, 'overflow converting to u32')
        }
    }
    let paddedBytes = new Uint8Array(4)
    paddedBytes[0] = 0
    paddedBytes[1] = 0
    paddedBytes[2] = 0
    paddedBytes[3] = 0
    let minLen = paddedBytes.length < array.length ? paddedBytes.length : array.length
    for (let i = 0; i < minLen; i++) {
        paddedBytes[i] = array[i]
    }
    let x: u32 = 0
    x = (x | paddedBytes[0]) << 8
    x = (x | paddedBytes[1]) << 8
    x = (x | paddedBytes[2]) << 8
    x = x | paddedBytes[3]
    return x
}

export function universalDecodeNumber(bytes: Uint8Array, signed: bool): u64 {
    if (bytes.length == 0) {
        return 0
    }

    const negative = signed && bytes[0] >> 7 == 1
    let result = negative ? u64.MAX_VALUE : 0

    for (let i = 0; i < bytes.length; i++) {
        result = result << 8
        result |= bytes[i] as u64
    }

    return result
}

export function numberToBytes<T extends number>(value: T): Uint8Array {
    const size = sizeof<T>()
    const buffer = new ArrayBuffer(size as i32)
    const view = new DataView(buffer)

    if (nameof<T>() == nameof<i8>()) {
        view.setInt8(0, value as i8)
    } else if (nameof<T>() == nameof<i16>()) {
        view.setInt16(0, value as i16)
    } else if (nameof<T>() == nameof<i32>()) {
        view.setInt32(0, value as i32)
    } else if (nameof<T>() == nameof<i64>()) {
        view.setInt64(0, value as i64)
    } else if (nameof<T>() == nameof<u8>()) {
        view.setUint8(0, value as u8)
    } else if (nameof<T>() == nameof<u16>()) {
        view.setUint16(0, value as u16)
    } else if (nameof<T>() == nameof<u32>()) {
        view.setUint32(0, value as u32)
    } else if (nameof<T>() == nameof<u64>()) {
        view.setUint64(0, value as u64)
    } else {
        throw new Error(`TODO : not implemented : ${nameof<T>()}`)
    }

    return Uint8Array.wrap(buffer)
}
