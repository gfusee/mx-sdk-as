import {BaseManagedType} from "../interfaces/managedType";
import {BigUint} from "../bigUint";
import {ElrondString} from "../erdString";
import {checkIfDebugBreakpointEnabled, smallIntFinishUnsigned, smallIntGetUnsignedArgument} from "../../utils/env";
import {numberToBytes, universalDecodeNumber} from "../../utils/math/number";
import {NestedEncodeOutput} from "../interfaces/nestedEncodeOutput";
import {bytesToSize} from "../../utils/bytes";
import {getBytesFromStorage} from "../../utils/storage";
import {ManagedBufferNestedDecodeInput} from "../managedBufferNestedDecodeInput";
import {ElrondU32} from "./elrondu32";
import {BaseManagedUtils} from "../interfaces/managedUtils";
import {ElrondU8} from "./elrondu8";

@unmanaged
export class ElrondU64 extends BaseManagedType {

    // Notes : assigning changetype<XXX>(0) in a class property is considered the same as null
    // To avoid it we applied +1 transformation to the given value
    // PS : this class is instable due to overflows, this is temporary

    private __value: u64

    get value(): u64 {
        return this.__value
    }

    get utils(): ElrondU64.Utils {
        return new ElrondU64.Utils(this)
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
        return this.value
    }

    toBigUint(): BigUint {
        return this.utils.toBigUint()
    }

    static fromValue(value: u64): ElrondU64 {
        const result = new ElrondU64()
        result.__value = value

        return result
    }

    static zero(): ElrondU64 {
        return ElrondU64.fromValue(0)
    }

    static dummy(): ElrondU64 {
        return changetype<ElrondU64>(0)
    }

    @operator("+")
    __add(a: this): this {
        return ElrondU64.fromValue(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return ElrondU64.fromValue(this.value - a.value)
    }

    @operator("*")
    __mul(a: this): this {
        return ElrondU64.fromValue(this.value * a.value)
    }

    @operator("/")
    __div(a: this): this {
        return ElrondU64.fromValue(this.value / a.value)
    }

    @operator("%")
    __mod(a: this): this {
        return ElrondU32.fromValue(this.value % a.value)
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
        return this.__add(ElrondU64.fromValue(1))
    }
}

export namespace ElrondU64 {

    @unmanaged
    export class Utils extends BaseManagedUtils<ElrondU64> {

        constructor(public _value: ElrondU64) {
            super();
        }

        get value(): ElrondU64 {
            return this._value
        }

        get sizeOf(): i32 {
            return 8
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

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondU64 {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: T): ElrondU64 {
            return ElrondU64.fromValue(value)
        }

        fromHandle(handle: i32): ElrondU64 {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ElrondU64 {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): ElrondU64 {
            const value = smallIntGetUnsignedArgument(index)

            return ElrondU64.fromValue(value)
        }

        fromBytes(bytes: Uint8Array): ElrondU64 {
            const value = universalDecodeNumber(bytes, false)

            return ElrondU64.fromValue(value)
        }

        decodeTop(buffer: ElrondString): ElrondU64 {
            const value = buffer.utils.toU64().value

            return ElrondU64.fromValue(value)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondU64 {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as u64

            return ElrondU64.fromValue(result)
        }

    }

}