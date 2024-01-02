import {ElrondString} from "./erdString";
import {BigUint} from "./bigUint";
import {PreloadedManagedBuffer} from "./preloadedManagedBuffer";
import {ElrondU32} from "./numbers";
import {ElrondU8} from "./numbers/elrondu8";

export class ManagedBufferNestedDecodeInput {

    private decodeIndex: ElrondU32
    private buffer: PreloadedManagedBuffer

    constructor(
        buffer: ElrondString
    ) {
        this.decodeIndex = ElrondU32.zero()
        this.buffer = new PreloadedManagedBuffer(buffer)
    }

    getRemainingLength(): ElrondU32 {
        return this.buffer.bufferLength - this.decodeIndex
    }

    //TODO : handle errors
    readInto(
        into: Uint8Array
    ): void {
        this.buffer.loadSlice(this.decodeIndex, into)

        this.decodeIndex += ElrondU32.fromValue(into.byteLength)
    }

    readByte(): ElrondU8 {
        const buf = new Uint8Array(1)
        this.readInto(buf)
        return ElrondU8.fromValue(buf[0])
    }

    readManagedBuffer(): ElrondString {
        const size = ElrondU32.dummy().utils.decodeNested(this)

        return this.readManagedBufferOfSize(size)
    }

    readManagedBufferOfSize(
        size: ElrondU32
    ): ElrondString {
        const buffer = this.buffer.copySlice(this.decodeIndex, size)
        this.decodeIndex += size

        return buffer
    }

    readBigUint(): BigUint {
        return BigUint.fromElrondString(this.readManagedBuffer())
    }

}
