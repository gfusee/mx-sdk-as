import {ManagedBuffer} from "./buffer";
import {BigUint} from "./bigUint";
import {PreloadedManagedBuffer} from "./preloadedManagedBuffer";
import {ManagedU32} from "./numbers";
import {ManagedU8} from "./numbers/u8";

export class ManagedBufferNestedDecodeInput {

    private decodeIndex: ManagedU32
    private buffer: PreloadedManagedBuffer

    constructor(
        buffer: ManagedBuffer
    ) {
        this.decodeIndex = ManagedU32.zero()
        this.buffer = new PreloadedManagedBuffer(buffer)
    }

    getRemainingLength(): ManagedU32 {
        return this.buffer.bufferLength - this.decodeIndex
    }

    //TODO : handle errors
    readInto(
        into: Uint8Array
    ): void {
        this.buffer.loadSlice(this.decodeIndex, into)

        this.decodeIndex += ManagedU32.fromValue(into.byteLength)
    }

    readByte(): ManagedU8 {
        const buf = new Uint8Array(1)
        this.readInto(buf)
        return ManagedU8.fromValue(buf[0])
    }

    readManagedBuffer(): ManagedBuffer {
        const size = ManagedU32.dummy().utils.decodeNested(this)

        return this.readManagedBufferOfSize(size)
    }

    readManagedBufferOfSize(
        size: ManagedU32
    ): ManagedBuffer {
        const buffer = this.buffer.copySlice(this.decodeIndex, size)
        this.decodeIndex += size

        return buffer
    }

    readBigUint(): BigUint {
        return BigUint.fromManagedBuffer(this.readManagedBuffer())
    }

}
