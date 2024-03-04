import { getBytesFromStorage } from "../utils/storage";
import { ManagedBuffer } from "./buffer";
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32, ManagedU8} from "./numbers";
import {BaseManagedUtils} from "./interfaces/managedUtils";
import {Option} from "./option";

@unmanaged
export class OptionalValue<T extends ManagedType> extends BaseManagedType {

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

    get utils(): OptionalValue.Utils<T> {
        return new OptionalValue.Utils<T>(this)
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

    intoOption(): Option<T> {
        return Option.withValue<T>(this.value)
    }

    getHandle(): i32 {
        if (this._bufferCache !== null) {
            return this._bufferCache!.getHandle()
        } else {
            const buffer = ManagedBuffer.new()
            this.utils.encodeNested(buffer)
            this._bufferCache = buffer
            return buffer.getHandle()
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

    static null<T extends ManagedType>(): OptionalValue<T> {
        return BaseManagedType.dummy<OptionalValue<T>>().utils.fromNull()
    }

    static withValue<T extends ManagedType>(value: T | null): OptionalValue<T> {
        return BaseManagedType.dummy<OptionalValue<T>>().utils.fromValue(value)
    }

}

export namespace OptionalValue {


    @final @unmanaged
    export class Utils<T extends ManagedType> extends BaseManagedUtils<OptionalValue<T>> {

        constructor(
            public _value: OptionalValue<T>
        ) {
            super()
        }

        get value(): OptionalValue<T> {
            return this._value
        }

        fromNull(): OptionalValue<T> {
            this.value.type = ManagedU8.zero()
            this.value.value = null

            return this.value
        }

        fromValue(value: T | null): OptionalValue<T> {
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
            const value = this.value.unwrapOrNull()
            if (value) {
                return value.utils.encodeTop()
            } else {
                return ManagedBuffer.new()
            }
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const value = this.value.unwrapOrNull()
            if (value) {
                value.utils.encodeNested(output)
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

        fromHandle(handle: number): OptionalValue<T> {
            throw new Error('TODO : error no handle (optionalValue)')
        }

        fromStorage(key: ManagedBuffer): OptionalValue<T> {
            const bytes = getBytesFromStorage(key)
            return this.fromBytes(bytes)
        }

        fromArgumentIndex(index: i32): OptionalValue<T> {
            const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(index)
            return this.decodeTop(buffer)
        }

        fromBytes(bytes: Uint8Array): OptionalValue<T> {
            const buffer = ManagedBuffer.dummy().utils.fromBytes(bytes)
            return this.decodeTop(buffer)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): OptionalValue<T> {
            return BaseManagedUtils.defaultFromByteReader<OptionalValue<T>, Utils<T>>(this, retainedPtr, reader)
        }

        decodeTop(buffer: ManagedBuffer): OptionalValue<T> {
            if (buffer.utils.getBytesLength() == 0) {
                return this.fromNull()
            } else {
                const value = BaseManagedType.dummy<T>().utils.decodeTop(buffer)
                return this.fromValue(value)
            }
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): OptionalValue<T> {
            if (input.getRemainingLength() == ManagedU32.zero()) {
                return this.fromNull()
            } else {
                const value = BaseManagedType.dummy<T>().utils.decodeNested(input)
                return this.fromValue(value)
            }
        }

    }

}
