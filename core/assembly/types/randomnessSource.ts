import { ManagedBuffer, ManagedU32, ManagedU64, ManagedU8 } from ".";
import { universalDecodeNumber } from "../utils/math/number";
import {Static} from "../utils/env";

export class RandomnessSource {

    private static _buffer: ManagedBuffer | null = null

    private static get buffer(): ManagedBuffer {
        if (RandomnessSource._buffer) {
            return RandomnessSource._buffer!
        } else {
            const buffer = ManagedBuffer.new()
            RandomnessSource._buffer = buffer
            return buffer
        }
    }

    private constructor() {
        throw new Error("Cannot instantiate RandomnessSource")
    }

    static nextU8(): ManagedU8 {
        const size = sizeof<u8>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ManagedU32.zero(), bytes)

        return ManagedU8.fromValue(universalDecodeNumber(bytes, false) as u8)
    }

    static nextU8InRange(min: ManagedU8, max: ManagedU8): ManagedU8 {
        const rand = this.nextU8()

        return min + rand % (max - min)
    }

    static nextU32(): ManagedU32 {
        const size = sizeof<u32>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ManagedU32.zero(), bytes)

        return ManagedU32.fromValue(universalDecodeNumber(bytes, false) as u32)
    }

    static nextU32InRange(min: ManagedU32, max: ManagedU32): ManagedU32 {
        const rand = this.nextU32()

        return min + rand % (max - min)
    }

    static nextU64(): ManagedU64 {
        const size = sizeof<u64>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ManagedU32.zero(), bytes)

        return ManagedU64.fromValue(universalDecodeNumber(bytes, false) as u64)
    }

    static nextU64InRange(min: ManagedU64, max: ManagedU64): ManagedU64 {
        const rand = this.nextU32()

        return min + rand % (max - min)
    }

}
