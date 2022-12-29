import { bytesToSize } from "../utils/bytes"
import {
    smallIntFinishUnsigned,
    smallIntGetUnsignedArgument,
} from "../utils/env"
import {numberToBytes, universalDecodeNumber} from "../utils/math/number"
import { getBytesFromStorage } from "../utils/storage"
import { BigUint } from "./bigUint"
import { ElrondString } from "./erdString"
import { ManagedType } from "./interfaces/managedType"
import { ManagedUtils } from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";
import {ArgumentLoader} from "../utils/argumentLoader"
import {TokenIdentifier} from "./tokenIdentifier"

@unmanaged
export class ElrondUnsignedNumber<T extends Number> extends ManagedType {

    get value(): T {
        return changetype<u32>(this) as T
    }

    get utils(): ElrondUnsignedNumber.Utils<T> {
        return ElrondUnsignedNumber.Utils.fromValue(this)
    }

    get skipsReserialization(): boolean {
        return true
    }

    get payloadSize(): ElrondU32 {
        return ElrondU32.fromValue(sizeof<T>())
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

    static fromValue<T extends Number>(value: T): ElrondUnsignedNumber<T> {
        return changetype<ElrondUnsignedNumber<T>>(value as u32)
    }

    static zero<T extends Number>(): ElrondUnsignedNumber<T> {
        return ElrondUnsignedNumber.fromValue<T>(0 as T)
    }

    @operator("+")
    __add(a: this): this {
        return changetype<ElrondUnsignedNumber<T>>(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return changetype<ElrondUnsignedNumber<T>>(this.value - a.value)
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
        return this.__add(ElrondUnsignedNumber.fromValue<T>(1 as T))
    }

}

export namespace ElrondUnsignedNumber {

    @unmanaged
    export class Utils<T extends Number> extends ManagedUtils<ElrondUnsignedNumber<T>> {

        static fromValue<T extends Number>(value: ElrondUnsignedNumber<T>): Utils<T> {
            return changetype<Utils<T>>(value)
        }

        get value(): ElrondUnsignedNumber<T> {
            return changetype<ElrondUnsignedNumber<T>>(this)
        }

        storeAtBuffer(key: ElrondString): void {
            BigUint.fromU64(this.value.toU64()).utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.toBigUint().utils.signalError()
        }

        finish(): void {
            //@ts-ignore
            smallIntFinishUnsigned(<i64>this.value.value)
        }

        encodeTop(): ElrondString {
            return ElrondString.fromBytes(numberToBytes(this.value.toU64()))
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

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondUnsignedNumber<T> {
            const bytes = new Uint8Array(sizeof<T>())
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: T): ElrondUnsignedNumber<T> {
            return ElrondUnsignedNumber.fromValue<T>(value)
        }

        fromHandle(handle: i32): ElrondUnsignedNumber<T> {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ElrondUnsignedNumber<T> {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgument<L extends ArgumentLoader>(loader: L): ElrondUnsignedNumber<T> {
            const value = loader.getSmallIntUnsignedArgumentAtIndex(loader.currentIndex)
            loader.currentIndex++

            return ElrondUnsignedNumber.fromValue<T>(value)
        }

        fromBytes(bytes: Uint8Array): ElrondUnsignedNumber<T> {
            const value = universalDecodeNumber(bytes, false)

            return ElrondUnsignedNumber.fromValue<T>(value as T)
        }

        decodeTop(buffer: ElrondString): ElrondUnsignedNumber<T> {
            const value = buffer.utils.toU64().value

            return ElrondUnsignedNumber.fromValue<T>(value)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondUnsignedNumber<T> {
            const size: i32 = sizeof<T>()
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as T

            return ElrondUnsignedNumber.fromValue<T>(result)
        }

    }

}
