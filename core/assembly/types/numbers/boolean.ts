import {defaultBaseManagedTypeWriteImplementation, ManagedType} from "../interfaces/managedType"
import {BigUint} from "../bigUint";
import {ManagedUtils} from "../interfaces/managedUtils";
import {ManagedBuffer} from "../buffer";
import {checkIfDebugBreakpointEnabled, smallIntFinishUnsigned, smallIntGetUnsignedArgument} from "../../utils/env";
import {numberToBytes, universalDecodeNumber} from "../../utils/math/number";
import {NestedEncodeOutput} from "../interfaces/nestedEncodeOutput";
import {bytesToSize} from "../../utils/bytes";
import {getBytesFromStorage} from "../../utils/storage";
import {ManagedBufferNestedDecodeInput} from "../bufferNestedDecodeInput";
import {ManagedU32} from "./u32";
import {ManagedU8} from "./u8";

@unmanaged
export class ManagedBoolean extends ManagedType {

    get value(): boolean {
        const value = changetype<u32>(this) as u8 - 1

        if (value == 0) {
            return false
        } else {
            return true
        }
    }

    get utils(): ManagedBoolean.Utils {
        return ManagedBoolean.Utils.fromValue(this)
    }

    get payloadSize(): ManagedU32 {
        return ManagedU32.fromValue(this.utils.sizeOf)
    }

    get shouldBeInstantiatedOnHeap(): boolean {
        return false
    }

    skipsReserialization(): boolean {
        return true
    }

    getHandle(): i32 {
        throw new Error('TODO getHandle (ManagedUXX)')
    }

    toU64(): u64 {
        return this.value as u64
    }

    toBigUint(): BigUint {
        return this.utils.toBigUint()
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static fromBoolean(boolean: boolean): ManagedBoolean {
        if (boolean) {
            return changetype<ManagedBoolean>(2) // 1 + 1
        } else {
            return changetype<ManagedBoolean>(1) // 0 + 1
        }
    }

    static false(): ManagedBoolean {
        return ManagedBoolean.fromBoolean(false)
    }

    static true(): ManagedBoolean {
        return ManagedBoolean.fromBoolean(true)
    }

    static dummy(): ManagedBoolean {
        return ManagedBoolean.false()
    }

    @operator("==")
    __equals(a: this): bool {
        return this.value == a.value
    }

    @operator("!=")
    __notEquals(a: this): bool {
        return !(this == a)
    }
}

export namespace ManagedBoolean {

    @unmanaged
    export class Utils extends ManagedUtils<ManagedBoolean> {

        get sizeOf(): i32 {
            return 1
        }

        static fromValue(value: ManagedBoolean): Utils {
            return changetype<Utils>(value)
        }

        get value(): ManagedBoolean {
            return changetype<ManagedBoolean>(this)
        }

        storeAtBuffer(key: ManagedBuffer): void {
            BigUint.fromU64(this.value.toU64()).utils.storeAtBuffer(key)
        }

        signalError(): void {
            ManagedU8.fromValue(this.value.toU64()).utils.signalError()
        }

        finish(): void {
            //@ts-ignore
            smallIntFinishUnsigned(<i64>this.value.value)
        }

        encodeTop(): ManagedBuffer {
            return ManagedBuffer.fromBytes(numberToBytes<u64>(this.value.toU64()))
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const bytesLength: i32 = this.sizeOf

            const bytes = bytesToSize(numberToBytes(this.value.value), bytesLength)

            output.write(bytes)
        }

        toString(): string {
            return ""
        }

        toBytes(): Uint8Array {
            if (this.value.value) {
                return numberToBytes(1)
            } else {
                return numberToBytes(0)
            }
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const bytes = this.toBytes()
            return writer(retainedPtr, bytes)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedBoolean {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromHandle(handle: i32): ManagedBoolean {
            throw new Error('TODO : error no handle (ManagedUXX)')
        }

        fromStorage(key: ManagedBuffer): ManagedBoolean {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): ManagedBoolean {
            return this.fromValue(smallIntGetUnsignedArgument(index))
        }

        fromValue(value: u64): ManagedBoolean {
            if (value == 0) {
                return ManagedBoolean.false()
            } else if (value == 1) {
                return ManagedBoolean.true()
            } else {
                throw new Error('Cannot instantiate ManagedBoolean from given value')
            }
        }

        fromBytes(bytes: Uint8Array): ManagedBoolean {
            return this.fromValue(universalDecodeNumber(bytes, false))
        }

        decodeTop(buffer: ManagedBuffer): ManagedBoolean {
            return this.fromValue(buffer.utils.toU64().value)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ManagedBoolean {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = this.fromValue(universalDecodeNumber(bytes.slice(0, size), false))

            return result
        }

    }

}
