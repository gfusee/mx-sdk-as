import {areBytesEquals, bytesToSize} from "../utils/bytes"
import {ManagedBuffer} from "./buffer"
import {ManagedWrappedString} from "./managedWrappedString"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils";
import {checkIfDebugBreakpointEnabled} from "../utils/env";
import {defaultBaseManagedTypeWriteImplementation} from "./interfaces/managedType"

@unmanaged
export class ManagedAddress extends ManagedWrappedString {

    get utils(): ManagedAddress.Utils {
        return ManagedAddress.Utils.fromValue(this)
    }

    isZero(): boolean {
        const zero = new Uint8Array(ManagedAddress.ADDRESS_BYTES_LEN)
        const bytes = this.utils.toBytes()
        const result = areBytesEquals(bytes, zero)

        heap.free(changetype<i32>(zero))
        heap.free(changetype<i32>(bytes))

        return result
    }

    skipsReserialization(): boolean {
        return false
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from(buffer: ManagedBuffer): ManagedAddress {
        return ManagedAddress.dummy().utils.fromBuffer(buffer)
    }

    static zero(): ManagedAddress {
        const bytes = new Uint8Array(ManagedAddress.ADDRESS_BYTES_LEN)

        return ManagedAddress.from(ManagedBuffer.fromBytes(bytes))
    }

    static dummy(): ManagedAddress {
        return changetype<ManagedAddress>(0)
    }

    static ADDRESS_BYTES_LEN: i32 = 32
}

export namespace ManagedAddress {

    @final @unmanaged
    export class Utils extends ManagedUtils<ManagedAddress> {

        static fromValue(value: ManagedAddress): Utils {
            return changetype<Utils>(value.getHandle())
        }

        get value(): ManagedAddress {
            return changetype<ManagedAddress>(this)
        }

        finish(): void {
            this.value.buffer.utils.finish()
        }

        storeAtBuffer(key: ManagedBuffer): void {
            this.value.buffer.utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.value.buffer.utils.signalError()
        }

        encodeTop(): ManagedBuffer {
            const output = ManagedBuffer.new()
            this.encodeNested(output);

            return output
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const bytes = bytesToSize(this.value.buffer.utils.toBytes(), ManagedAddress.ADDRESS_BYTES_LEN)

            output.write(bytes)
        }

        toBytes(): Uint8Array {
            return this.value.buffer.utils.toBytes()
        }

        toString(): string {
            return this.value.buffer.utils.toString()
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
        }

        fromBuffer(buffer: ManagedBuffer): ManagedAddress {
            return changetype<ManagedAddress>(buffer)
        }

        fromString(str: string): void {
            this.value.buffer = ManagedBuffer.fromString(str)
        }

        fromHandle(handle: i32): ManagedAddress {
            return changetype<ManagedAddress>(handle)
        }

        fromArgumentIndex(argIndex: i32): ManagedAddress {
            const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(argIndex)
            return this.fromBuffer(buffer)
        }

        fromStorage(key: ManagedBuffer): ManagedAddress {
            return this.fromBuffer(ManagedBuffer.dummy().utils.fromStorage(key))
        }

        fromBytes(bytes: Uint8Array): ManagedAddress {
            return this.fromBuffer(ManagedBuffer.dummy().utils.fromBytes(bytes))
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedAddress {
            return BaseManagedUtils.defaultFromByteReader<ManagedAddress, Utils>(this, retainedPtr, reader)
        }

        decodeTop(buffer: ManagedBuffer): ManagedAddress {
            const bytes = new Uint8Array(ManagedAddress.ADDRESS_BYTES_LEN)
            buffer.utils.loadSlice(ManagedU32.zero(), bytes)

            return this.fromBytes(bytes)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ManagedAddress {
            return changetype<ManagedAddress>(input.readManagedBufferOfSize(ManagedU32.fromValue(ManagedAddress.ADDRESS_BYTES_LEN)))
        }

    }
}
