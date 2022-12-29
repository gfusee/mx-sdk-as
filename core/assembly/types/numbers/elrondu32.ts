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
import {ElrondU64} from "./elrondu64";
import {ElrondU8} from "./elrondu8";
import {ArgumentLoader} from "../../utils/argumentLoader"

@unmanaged
export class ElrondU32 extends ManagedType {

    get value(): u32 {
        return changetype<u32>(this) - 1
    }

    get utils(): ElrondU32.Utils {
        return ElrondU32.Utils.fromValue(this)
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

    static fromValue(value: u32): ElrondU32 {
        return changetype<ElrondU32>(value as u32 + 1)
    }

    static zero(): ElrondU32 {
        return ElrondU32.fromValue(0)
    }

    static dummy(): ElrondU32 {
        return ElrondU32.zero()
    }

    @operator("+")
    __add(a: this): this {
        return ElrondU32.fromValue(this.value + a.value)
    }

    @operator("-")
    __sub(a: this): this {
        return ElrondU32.fromValue(this.value - a.value)
    }

    @operator("*")
    __mul(a: this): this {
        return ElrondU32.fromValue(this.value * a.value)
    }

    @operator("/")
    __div(a: this): this {
        return ElrondU32.fromValue(this.value / a.value)
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
        return this.__add(ElrondU32.fromValue(1))
    }
}

export namespace ElrondU32 {

    @unmanaged
    export class Utils extends ManagedUtils<ElrondU32> {

        get sizeOf(): i32 {
            return 4
        }

        static fromValue(value: ElrondU32): Utils {
            return changetype<Utils>(value)
        }

        get value(): ElrondU32 {
            return changetype<ElrondU32>(this)
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
            return BigUint.fromU64(this.value.value as u32)
        }

        toBytes(): Uint8Array {
            return numberToBytes(this.value.value)
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            const bytes = this.toBytes()
            return writer(retainedPtr, bytes)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondU32 {
            const bytes = new Uint8Array(this.sizeOf)
            reader(retainedPtr, bytes)
            return this.fromBytes(bytes)
        }

        fromValue(value: u32): ElrondU32 {
            return ElrondU32.fromValue(value)
        }

        fromHandle(handle: i32): ElrondU32 {
            throw new Error('TODO : error no handle (ElrondUXX)')
        }

        fromStorage(key: ElrondString): ElrondU32 {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgument<L extends ArgumentLoader>(loader: L): ElrondU32 {
            const value = loader.getSmallIntUnsignedArgumentAtIndex(loader.currentIndex)
            loader.currentIndex++

            return ElrondU32.fromValue(value as u32)
        }

        fromBytes(bytes: Uint8Array): ElrondU32 {
            const value = universalDecodeNumber(bytes, false)

            return ElrondU32.fromValue(value as u32)
        }

        decodeTop(buffer: ElrondString): ElrondU32 {
            const value = buffer.utils.toU64().value

            return ElrondU32.fromValue(value as u32)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondU32 {
            const size: i32 = this.sizeOf
            const bytes = new Uint8Array(size)
            input.readInto(bytes)

            const result = universalDecodeNumber(bytes.slice(0, size), false) as u32

            return ElrondU32.fromValue(result)
        }

    }

}
