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
import {ArgumentLoader} from "../../utils/argumentLoader"
import {TokenIdentifier} from "../tokenIdentifier"

@unmanaged
export class ElrondU8 extends ManagedType {

    get value(): u8 {
        return changetype<u32>(this) as u8 - 1
    }

    get utils(): ElrondU8.Utils {
        return ElrondU8.Utils.fromValue(this)
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

    static fromValue(value: u8): ElrondU8 {
        return changetype<ElrondU8>(value as u32 + 1)
    }

    static zero(): ElrondU8 {
        return ElrondU8.fromValue(0)
    }

    static dummy(): ElrondU8 {
        return ElrondU8.zero()
    }

    @operator("+")
    __add(a: this): this {
        return ElrondU8.fromValue(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return ElrondU8.fromValue(this.value - a.value)
    }

    @operator("*")
    __mul(a: this): this {
        return ElrondU8.fromValue(this.value * a.value)
    }

    @operator("/")
    __div(a: this): this {
        return ElrondU8.fromValue(this.value / a.value)
    }

    @operator("%")
    __mod(a: this): this {
        return ElrondU8.fromValue(this.value % a.value)
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
        return this.__add(ElrondU8.fromValue(1))
    }
}

export namespace ElrondU8 {

    @unmanaged
    export class Utils extends ManagedUtils<ElrondU8> {

        get sizeOf(): i32 {
            return 1
        }

        static fromValue(value: ElrondU8): Utils {
            return changetype<Utils>(value)
        }

        get value(): ElrondU8 {
            return changetype<ElrondU8>(this)
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

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondU8 {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: u32): ElrondU8 {
            return ElrondU8.fromValue(value)
        }

        fromHandle(handle: i32): ElrondU8 {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ElrondU8 {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgument<L extends ArgumentLoader>(loader: L): ElrondU8 {
            const value = loader.getSmallIntUnsignedArgumentAtIndex(loader.currentIndex)
            loader.currentIndex++

            return ElrondU8.fromValue(value)
        }

        fromBytes(bytes: Uint8Array): ElrondU8 {
            const value = universalDecodeNumber(bytes, false)

            return ElrondU8.fromValue(value as u8)
        }

        decodeTop(buffer: ElrondString): ElrondU8 {
            const value = buffer.utils.toU64().value

            return ElrondU8.fromValue(value as u8)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondU8 {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as u32

            return ElrondU8.fromValue(result as u8)
        }

    }

}
