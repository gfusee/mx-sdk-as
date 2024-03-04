import { getBytesFromStorage } from "../utils/storage";
import { ManagedBuffer } from "./buffer";
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils";
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU8} from "./numbers/u8";
import {ManagedU32} from "./numbers";

@unmanaged
export class Option<T extends ManagedType> extends BaseManagedType {

    private _type!: ManagedU8 //TODO : optimize by removing this field
    private _value: T | null = null

    get type(): ManagedU8 {
        return this._type
    }

    set type(type: ManagedU8) {
        this._bufferCache = null
        this._type = type
    }

    get value(): T | null {
        return this._value
    }

    set value(value: T | null) {
        this._bufferCache = null
        this._value = value
    }

    get utils(): Option.Utils<T> {
        return new Option.Utils<T>(this)
    }

    get payloadSize(): ManagedU32 {
        return ManagedU32.fromValue(4)
    }

    get shouldBeInstantiatedOnHeap(): boolean {
        return true
    }

    skipsReserialization(): boolean {
        return false
    }

    getHandle(): i32 {
        if (this._bufferCache !== null) {
            return this._bufferCache!.getHandle()
        } else {
            const bufferCache = this.utils.encodeNested()
            this._bufferCache = bufferCache
            return bufferCache.getHandle()
        }
    }

    private _bufferCache: ManagedBuffer | null = null

    isNull(): bool {
        return this.type.value == 0
    }

    unwrap(): T {
        if (this.value) {
            return this.value!
        } else {
            ManagedBuffer.fromString('cannot unwrap null')
        }

        return this.value! //TODO : use never type
    }

    unwrapOrNull(): T | null {
        if (this.value) {
            return this.value!
        } else {
            return null
        }
    }

    unwrapOr(value: T): T {
        if (this.value) {
            return this.value!
        } else {
            return value
        }
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static null<T extends ManagedType>(): Option<T> {
        return BaseManagedType.dummy<Option<T>>().utils.fromNull()
    }

    static withValue<T extends ManagedType>(value: T | null): Option<T> {
        return BaseManagedType.dummy<Option<T>>().utils.fromValue(value)
    }

}

export namespace Option {

    @unmanaged
    export class Utils<T extends ManagedType> extends BaseManagedUtils<Option<T>> {

        constructor(
            private _value: Option<T>
        ) {
            super()
        }

        get value(): Option<T> {
            return this._value
        }

        fromNull(): Option<T> {
            this.value.type = ManagedU8.zero()
            this.value.value = null

            return this.value
        }

        fromValue(value: T | null): Option<T> {
            if (!value) {
                return this.fromNull()
            }

            this.value.type = ManagedU8.fromValue(1)
            this.value.value = value

            return this.value
        }

        storeAtBuffer(key: ManagedBuffer): void {
            this.encodeTop().utils.storeAtBuffer(key)
        }

        signalError(): void { // TODO : better impl
            ManagedBuffer.fromString(this.toString()).utils.signalError()
        }

        finish(): void {
            this.encodeTop().utils.finish()
        }

        encodeTop(): ManagedBuffer {
            const output = ManagedBuffer.new()
            this.encodeNested(output)

            return output
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            if (!this.value.isNull()) {
                this.value.type.utils.encodeNested(output)
                this.value.value!.utils.encodeNested(output)
            }
        }

        toString(): string {
            if (this.value.isNull()) {
                return 'null'
            } else {
                return this.value.unwrap().utils.toString()
            }
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils<T>, R>(this, retainedPtr, writer)
        }

        fromHandle(handle: i32): Option<T> {
            throw new Error('TODO : error no handle (option)')
        }

        fromStorage(key: ManagedBuffer): Option<T> {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): Option<T> {
            const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(index)
            return this.decodeNested(new ManagedBufferNestedDecodeInput(buffer))
        }

        fromBytes(bytes: Uint8Array): Option<T> {
            const buffer = ManagedBuffer.dummy().utils.fromBytes(bytes)
            return this.decodeTop(buffer)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): Option<T> {
            return BaseManagedUtils.defaultFromByteReader<Option<T>, Utils<T>>(this, retainedPtr, reader)
        }

        decodeTop(buffer: ManagedBuffer): Option<T> {
            if (buffer.utils.getBytesLength() == 0) {
                return this.fromNull()
            } else {
                const value = BaseManagedType.dummy<T>().utils.decodeTop(buffer)
                return this.fromValue(value)
            }
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): Option<T> {
            const type = ManagedU8.dummy().utils.decodeNested(input)

            this.value.type = type

            if (type.value == 0) {
                return this.fromNull()
            } else {
                const value = BaseManagedType.dummy<T>().utils.decodeNested(input)
                return this.fromValue(value)
            }
        }
    }

}
