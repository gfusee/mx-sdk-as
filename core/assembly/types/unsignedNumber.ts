import { bytesToSize } from "../utils/bytes"
import {
    smallIntFinishUnsigned,
    smallIntGetUnsignedArgument,
} from "../utils/env"
import {numberToBytes, universalDecodeNumber} from "../utils/math/number"
import { getBytesFromStorage } from "../utils/storage"
import { BigUint } from "./bigUint"
import { ManagedBuffer } from "./buffer"
import {defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import { ManagedUtils } from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";

@unmanaged
export class ManagedUnsignedNumber<T extends Number> extends ManagedType {

    get value(): T {
        return changetype<u32>(this) as T
    }

    get utils(): ManagedUnsignedNumber.Utils<T> {
        return ManagedUnsignedNumber.Utils.fromValue(this)
    }

    get payloadSize(): ManagedU32 {
        return ManagedU32.fromValue(sizeof<T>())
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

    static fromValue<T extends Number>(value: T): ManagedUnsignedNumber<T> {
        return changetype<ManagedUnsignedNumber<T>>(value as u32)
    }

    static zero<T extends Number>(): ManagedUnsignedNumber<T> {
        return ManagedUnsignedNumber.fromValue<T>(0 as T)
    }

    @operator("+")
    __add(a: this): this {
        return changetype<ManagedUnsignedNumber<T>>(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return changetype<ManagedUnsignedNumber<T>>(this.value - a.value)
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
        return this.__add(ManagedUnsignedNumber.fromValue<T>(1 as T))
    }

}

export namespace ManagedUnsignedNumber {

    @unmanaged
    export class Utils<T extends Number> extends ManagedUtils<ManagedUnsignedNumber<T>> {

        static fromValue<T extends Number>(value: ManagedUnsignedNumber<T>): Utils<T> {
            return changetype<Utils<T>>(value)
        }

        get value(): ManagedUnsignedNumber<T> {
            return changetype<ManagedUnsignedNumber<T>>(this)
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
            return ManagedBuffer.fromBytes(numberToBytes(this.value.toU64()))
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const bytesLength: i32 = sizeof<T>()

            const bytes = bytesToSize(numberToBytes(this.value.value), bytesLength)

            output.write(bytes)
        }

        toString(): string {
            return ""
        }

        toBigUint(): BigUint {
            return BigUint.fromU64(this.value.value as u64)
        }

        toBytes(): Uint8Array {
            return numberToBytes(this.value.value)
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const bytes = this.toBytes()
            return writer(retainedPtr, bytes)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedUnsignedNumber<T> {
            const bytes = new Uint8Array(sizeof<T>())
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: T): ManagedUnsignedNumber<T> {
            return ManagedUnsignedNumber.fromValue<T>(value)
        }

        fromHandle(handle: i32): ManagedUnsignedNumber<T> {
            throw new Error('TODO : error no handle (ManagedUXX)')
        }

        fromStorage(key: ManagedBuffer): ManagedUnsignedNumber<T> {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): ManagedUnsignedNumber<T> {
            const value = smallIntGetUnsignedArgument(index)

            return ManagedUnsignedNumber.fromValue<T>(value)
        }

        fromBytes(bytes: Uint8Array): ManagedUnsignedNumber<T> {
            const value = universalDecodeNumber(bytes, false)

            return ManagedUnsignedNumber.fromValue<T>(value as T)
        }

        decodeTop(buffer: ManagedBuffer): ManagedUnsignedNumber<T> {
            const value = buffer.utils.toU64().value

            return ManagedUnsignedNumber.fromValue<T>(value)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ManagedUnsignedNumber<T> {
            const size: i32 = sizeof<T>()
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as T

            return ManagedUnsignedNumber.fromValue<T>(result)
        }

    }

}
