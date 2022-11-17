import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";

@unmanaged
export class BytesEncodeOutput extends NestedEncodeOutput {

    bytes: Uint8Array

    constructor() {
        super()
        this.bytes = new Uint8Array(0)
    }

    static fromBytes(bytes: Uint8Array): NestedEncodeOutput {
        const result = new BytesEncodeOutput()
        result.bytes = bytes

        return result
    }

    write(bytes: Uint8Array): void {
        const thisBytesLength = this.bytes.byteLength
        const newArray = new Uint8Array(thisBytesLength + bytes.byteLength)

        newArray.set(this.bytes, 0)
        newArray.set(bytes, thisBytesLength)

        this.bytes = newArray
        //TODO : check that old this.bytes is released from memory
    }
}

