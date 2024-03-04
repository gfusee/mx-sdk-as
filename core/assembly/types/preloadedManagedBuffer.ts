import {ManagedBuffer} from "./buffer";
import {ManagedU32} from "./numbers";

export class PreloadedManagedBuffer {

    public bufferLength: ManagedU32
    private _bufferBytes: Uint8Array | null = null

    get bufferBytes(): Uint8Array {
        if (this._bufferBytes) {
            return this._bufferBytes!
        } else {
            const bytes = new Uint8Array(this.bufferLength.value)
            this.buffer.utils.loadSlice(
                ManagedU32.zero(),
                bytes
            )

            this._bufferBytes = bytes

            return bytes
        }
    }

    constructor(
        public buffer: ManagedBuffer
    ) {
        this.bufferLength = ManagedU32.fromValue(this.buffer.utils.getBytesLength())
    }

    loadSlice(
        startPosition: ManagedU32,
        dest: Uint8Array
    ): void {
        dest.set(
            this.bufferBytes.subarray(startPosition.value, startPosition.value + dest.byteLength),
            0
        )
    }

    copySlice(
        startPosition: ManagedU32,
        sliceLength: ManagedU32
    ): ManagedBuffer {
        return this.buffer.utils.copySlice(
            startPosition,
            sliceLength
        )
    }

}
