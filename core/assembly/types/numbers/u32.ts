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
import {ManagedU64} from "./u64";
import {ManagedU8} from "./u8";

@unmanaged
export class ManagedU32 extends ManagedType {

    get value(): u32 {
        return changetype<u32>(this) - 1
    }

    get utils(): ManagedU32.Utils {
        return ManagedU32.Utils.fromValue(this)
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

    static fromValue(value: u32): ManagedU32 {
        return changetype<ManagedU32>(value as u32 + 1)
    }

    static zero(): ManagedU32 {
        return ManagedU32.fromValue(0)
    }

    static dummy(): ManagedU32 {
        return ManagedU32.zero()
    }

    @operator("+")
    __add(a: this): this {
        return ManagedU32.fromValue(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return ManagedU32.fromValue(this.value - a.value)
    }

    @operator("*")
    __mul(a: this): this {
        return ManagedU32.fromValue(this.value * a.value)
    }

    @operator("/")
    __div(a: this): this {
        return ManagedU32.fromValue(this.value / a.value)
    }

    @operator("%")
    __mod(a: this): this {
        return ManagedU32.fromValue(this.value % a.value)
    }

    @operator("==")
    __equals(a: this): bool {
        return this.value == a.value
    }

    @operator("!=")
    __notEquals(a: this): bool {
        return !(this == a)
    }

    @operator("<")
    __lessThan(a: this): bool {
        return this.value < a.value
    }

    @operator("<=")
    __lessThanOrEquals(a: this): bool {
        return !(this > a)
    }

    @operator(">")
    __greaterThan(a: this): bool {
        return !(this < a) && (this != a)
    }

    @operator(">=")
    __greaterThanOrEquals(a: this): bool {
        return !(this < a)
    }

    @operator.postfix("++")
    __increase(): this {
        return this.__add(ManagedU32.fromValue(1))
    }
}

export namespace ManagedU32 {

    @unmanaged
    export class Utils extends ManagedUtils<ManagedU32> {

        get sizeOf(): i32 {
            return 4
        }

        static fromValue(value: ManagedU32): Utils {
            return changetype<Utils>(value)
        }

        get value(): ManagedU32 {
            return changetype<ManagedU32>(this)
        }

        storeAtBuffer(key: ManagedBuffer): void {
            BigUint.fromU64(this.value.toU64()).utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.toBigUint().utils.signalError()
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

        toBigUint(): BigUint {
            return BigUint.fromU64(this.value.value as u32)
        }

        toBytes(): Uint8Array {
            return numberToBytes(this.value.value)
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const bytes = this.toBytes()
            return writer(retainedPtr, bytes)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedU32 {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: u32): ManagedU32 {
            return ManagedU32.fromValue(value)
        }

        fromHandle(handle: i32): ManagedU32 {
            throw new Error('TODO : error no handle (ManagedUXX)')
        }

        fromStorage(key: ManagedBuffer): ManagedU32 {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): ManagedU32 {
            const value = smallIntGetUnsignedArgument(index)

            return ManagedU32.fromValue(value as u32)
        }

        fromBytes(bytes: Uint8Array): ManagedU32 {
            const value = universalDecodeNumber(bytes, false)

            return ManagedU32.fromValue(value as u32)
        }

        decodeTop(buffer: ManagedBuffer): ManagedU32 {
            const value = buffer.utils.toU64().value

            return ManagedU32.fromValue(value as u32)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ManagedU32 {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as u32

            return ManagedU32.fromValue(result)
        }

    }

}
