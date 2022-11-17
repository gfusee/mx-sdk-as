import { ElrondString, ElrondU32, ElrondU64, ElrondU8 } from ".";
import { universalDecodeNumber } from "../utils/math/number";
import {Static} from "../utils/env";

export class RandomnessSource {

    private static _buffer: ElrondString | null = null

    private static get buffer(): ElrondString {
        if (RandomnessSource._buffer) {
            return RandomnessSource._buffer!
        } else {
            const buffer = ElrondString.new()
            RandomnessSource._buffer = buffer
            return buffer
        }
    }

    private constructor() {
        throw new Error("Cannot instantiate RandomnessSource")
    }

    static nextU8(): ElrondU8 {
        const size = sizeof<u8>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ElrondU32.zero(), bytes)

        return ElrondU8.fromValue(universalDecodeNumber(bytes, false) as u8)
    }

    static nextU8InRange(min: ElrondU8, max: ElrondU8): ElrondU8 {
        const rand = this.nextU8()

        return min + rand % (max - min)
    }

    static nextU32(): ElrondU32 {
        const size = sizeof<u32>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ElrondU32.zero(), bytes)

        return ElrondU32.fromValue(universalDecodeNumber(bytes, false) as u32)
    }

    static nextU32InRange(min: ElrondU32, max: ElrondU32): ElrondU32 {
        const rand = this.nextU32()

        return min + rand % (max - min)
    }

    static nextU64(): ElrondU64 {
        const size = sizeof<u64>()
        RandomnessSource.buffer.utils.fromRandom(size)
        const bytes = new Uint8Array(size)
        RandomnessSource.buffer.utils.loadSlice(ElrondU32.zero(), bytes)

        return ElrondU64.fromValue(universalDecodeNumber(bytes, false) as u64)
    }

    static nextU64InRange(min: ElrondU64, max: ElrondU64): ElrondU64 {
        const rand = this.nextU32()

        return min + rand % (max - min)
    }

}