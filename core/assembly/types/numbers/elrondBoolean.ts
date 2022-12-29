import {ManagedType} from "../interfaces/managedType";
import {BigUint} from "../bigUint";
import {ManagedUtils} from "../interfaces/managedUtils";
import {ElrondString} from "../erdString";
import {checkIfDebugBreakpointEnabled, smallIntFinishUnsigned, smallIntGetUnsignedArgument} from "../../utils/env";
import {numberToBytes, universalDecodeNumber} from "../../utils/math/number";
import {NestedEncodeOutput} from "../interfaces/nestedEncodeOutput";
import {bytesToSize} from "../../utils/bytes";
import {getBytesFromStorage} from "../../utils/storage";
import {ManagedBufferNestedDecodeInput} from "../managedBufferNestedDecodeInput";
import {ElrondU32} from "./elrondu32";
import {ElrondU8} from "./elrondu8";
import {ArgumentLoader} from "../../utils/argumentLoader"
import {TokenIdentifier} from "../tokenIdentifier"

@unmanaged
export class ElrondBoolean extends ManagedType {

    get value(): boolean {
        const value = changetype<u32>(this) as u8 - 1

        if (value == 0) {
            return false
        } else {
            return true
        }
    }

    get utils(): ElrondBoolean.Utils {
        return ElrondBoolean.Utils.fromValue(this)
    }

    get skipsReserialization(): boolean {
        return true
    }

    get payloadSize(): ElrondU32 {
        return ElrondU32.fromValue(this.utils.sizeOf)
    }

    get shouldBeInstantiatedOnHeap(): boolean {
        return false
    }

    getHandle(): i32 {
        throw new Error('TODO getHandle (ElrondUXX)')
    }

    toU64(): u64 {
        return this.value as u64
    }

    toBigUint(): BigUint {
        return this.utils.toBigUint()
    }

    static fromBoolean(boolean: boolean): ElrondBoolean {
        if (boolean) {
            return changetype<ElrondBoolean>(2) // 1 + 1
        } else {
            return changetype<ElrondBoolean>(1) // 0 + 1
        }
    }

    static false(): ElrondBoolean {
        return ElrondBoolean.fromBoolean(false)
    }

    static true(): ElrondBoolean {
        return ElrondBoolean.fromBoolean(true)
    }

    static dummy(): ElrondBoolean {
        return ElrondBoolean.false()
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

export namespace ElrondBoolean {

    @unmanaged
    export class Utils extends ManagedUtils<ElrondBoolean> {

        get sizeOf(): i32 {
            return 1
        }

        static fromValue(value: ElrondBoolean): Utils {
            return changetype<Utils>(value)
        }

        get value(): ElrondBoolean {
            return changetype<ElrondBoolean>(this)
        }

        storeAtBuffer(key: ElrondString): void {
            BigUint.fromU64(this.value.toU64()).utils.storeAtBuffer(key)
        }

        signalError(): void {
            ElrondU8.fromValue(this.value.toU64()).utils.signalError()
        }

        finish(): void {
            //@ts-ignore
            smallIntFinishUnsigned(<i64>this.value.value)
        }

        encodeTop(): ElrondString {
            return ElrondString.fromBytes(numberToBytes<u64>(this.value.toU64()))
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

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondBoolean {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromHandle(handle: i32): ElrondBoolean {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ElrondBoolean {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgument<L extends ArgumentLoader>(loader: L): ElrondBoolean {
            const value = loader.getSmallIntUnsignedArgumentAtIndex(loader.currentIndex)
            loader.currentIndex++

            return this.fromValue(value)
        }

        fromValue(value: u64): ElrondBoolean {
            if (value == 0) {
                return ElrondBoolean.false()
            } else if (value == 1) {
                return ElrondBoolean.true()
            } else {
                throw new Error('Cannot instantiate ElrondBoolean from given value')
            }
        }

        fromBytes(bytes: Uint8Array): ElrondBoolean {
            return this.fromValue(universalDecodeNumber(bytes, false))
        }

        decodeTop(buffer: ElrondString): ElrondBoolean {
            return this.fromValue(buffer.utils.toU64().value)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondBoolean {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = this.fromValue(universalDecodeNumber(bytes.slice(0, size), false))

            return result
        }

    }

}
