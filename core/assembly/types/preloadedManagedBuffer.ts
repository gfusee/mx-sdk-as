import {ElrondString} from "./erdString";
import {ElrondU32} from "./numbers";

export class PreloadedManagedBuffer {

    public bufferLength: ElrondU32
    private _bufferBytes: Uint8Array | null = null

    get bufferBytes(): Uint8Array {
        if (this._bufferBytes) {
            return this._bufferBytes!
        } else {
            const bytes = new Uint8Array(this.bufferLength.value)
            this.buffer.utils.loadSlice(
                ElrondU32.zero(),
                bytes
            )

            this._bufferBytes = bytes

            return bytes
        }
    }

    constructor(
        public buffer: ElrondString
    ) {
        this.bufferLength = ElrondU32.fromValue(this.buffer.utils.getBytesLength())
    }

    loadSlice(
        startPosition: ElrondU32,
        dest: Uint8Array
    ): void {
        dest.set(
            this.bufferBytes.subarray(startPosition.value, startPosition.value + dest.byteLength),
            0
        )
    }

    copySlice(
        startPosition: ElrondU32,
        sliceLength: ElrondU32
    ): ElrondString {
        return this.buffer.utils.copySlice(
            startPosition,
            sliceLength
        )
    }

}