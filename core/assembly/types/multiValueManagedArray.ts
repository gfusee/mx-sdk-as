import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {ManagedArray} from "./managedArray";
import {
    checkIfDebugBreakpointEnabled,
    getNumArguments
} from "../utils/env";
import {ManagedBuffer} from "./buffer";
import {ManagedU32} from "./numbers";
import {Option} from "./option";
import {BaseManagedUtils} from "./interfaces/managedUtils";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";

//TODO : make it allocated on the stack... but how to deal with the generic bug?
// An idea : remove ManagedUtils class and move all methods in ManagedType

//TODO 2 : use statics methods for common logics with ManagedArray
@unmanaged
export class MultiValueManagedArray<T extends BaseManagedType> extends BaseManagedType {

    __buffer: ManagedBuffer | null = null

    get buffer(): ManagedBuffer {
        if (this.__buffer) {
            return this.__buffer!
        } else {
            this.__buffer = ManagedBuffer.new()
            return this.__buffer!
        }
    }

    set buffer(value: ManagedBuffer) {
        this.__buffer = value
    }

    get utils(): MultiValueManagedArray.Utils<T> {
        return new MultiValueManagedArray.Utils<T>(this)
    }

    private _valuePayloadSizeCache: ManagedU32 | null = null

    get valuePayloadSize(): ManagedU32 {
        if (this._valuePayloadSizeCache) {
            return this._valuePayloadSizeCache!
        } else {
            const result = BaseManagedType.dummy<T>().payloadSize
            this._valuePayloadSizeCache = result
            return result
        }
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
        return this.buffer.getHandle()
    }

    get(index: ManagedU32): T {
        const payloadSize = this.valuePayloadSize.value
        const byteIndex = index.value * payloadSize
        const value = BaseManagedType.dummy<T>().utils.fromByteReader([byteIndex, changetype<i32>(this.buffer)], (retainedPtr, bytes) => {
            const byteIndexRef = retainedPtr[0]
            const bufferRef = changetype<ManagedBuffer>(retainedPtr[1])

            bufferRef.utils.loadSlice(ManagedU32.fromValue(byteIndexRef), bytes)
        })
        return value
    }

    tryGet(index: ManagedU32): Option<T> { //TODO : not optimized
        const length = this.getLength()

        if (index >= length) {
            return Option.null<T>()
        } else {
            return Option.withValue(this.get(index))
        }
    }

    push(value: T): void {
        value.utils.toByteWriter<void>([changetype<i32>(this.buffer)], (retainedPtr, bytes) => {
            const buffer = changetype<ManagedBuffer>(retainedPtr[0])
            buffer.appendBytes(bytes)
        })
    }

    appendArray(array: ManagedArray<T>): void {
        this.buffer.append(array.buffer)
    }

    getLength(): ManagedU32 {
        return ManagedU32.fromValue(this.buffer.utils.getBytesLength() / this.valuePayloadSize.value)
    }

    isEmpty(): bool {
        return this.buffer.utils.getBytesLength() == 0
    }

    forEach(action: (item: T) => void): void {
        const length = this.getLength()

        for (let i = ManagedU32.zero(); i < length; i++) {
            const item = this.get(i)
            action(item)
        }
    }

    asManagedArray(): ManagedArray<T> {
        return ManagedArray.fromBuffer<T>(this.buffer)
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static new<T extends BaseManagedType>(): MultiValueManagedArray<T> {
        return new MultiValueManagedArray<T>()
    }

    static fromSingleItem<T extends BaseManagedType>(item: T): MultiValueManagedArray<T> {
        const result = MultiValueManagedArray.new<T>()
        result.push(item)

        return result
    }

    static fromBuffer<T extends BaseManagedType>(buffer: ManagedBuffer): MultiValueManagedArray<T> {
        const result = MultiValueManagedArray.new<T>()
        result.buffer = buffer

        return result
    }

    static fromArrayOfBytes(bytes: Array<Uint8Array>): MultiValueManagedArray<ManagedBuffer> {
        const result = MultiValueManagedArray.new<ManagedBuffer>()
        for (let i = 0; i < bytes.length; i++) {
            result.push(ManagedBuffer.dummy().utils.fromBytes(bytes[i]))
        }

        return result
    }

    @operator("[]")
    __get(index: i32): T {
        return this.get(ManagedU32.fromValue(index as u32))
    }

    @operator("[]=")
    __set(index: i32, value: T): void {
        return this.set(index, value)
    }

}

export namespace MultiValueManagedArray {

    @unmanaged
    export class Utils<T extends BaseManagedType> extends BaseManagedUtils<MultiValueManagedArray<T>> {

        constructor(private _value: MultiValueManagedArray<T>) {
            super();
        }

        get value(): MultiValueManagedArray<T> {
            return this._value
        }

        storeAtBuffer(key: ManagedBuffer): void {
            this.encodeTop().utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.value.buffer.utils.signalError()
        }

        finish(): void {
            this.value.forEach((item) => {
                item.utils.finish()
            })
        }

        encodeTop(): ManagedBuffer {
            const dummy = BaseManagedType.dummy<T>()
            if (dummy.skipsReserialization()) {
                return this.value.buffer.clone()
            } else {
                const output = ManagedBuffer.new()
                this.encodeWithoutLength(output);
                return output
            }
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const length = this.value.getLength().value;
            (ManagedU32.fromValue(length)).utils.encodeNested(output)

            this.encodeWithoutLength(output)
        }

        encodeWithoutLength<T extends NestedEncodeOutput>(output: T): void {
            const length = this.value.getLength()
            for (let i = ManagedU32.zero(); i < length; i++) {
                const value = this.value.get(i)
                value.utils.encodeNested(output)
            }
        }

        toString(): string {
            let string = ''
            const valueLength = this.value.getLength()
            for (let i = ManagedU32.zero(); i < valueLength; i++) {
                const value = this.value.get(i)
                string = string + `${i.value} : ${value.utils.toString()}`
            }

            return string
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
        }

        fromHandle(handle: i32): MultiValueManagedArray<T> {
            this.value.buffer = ManagedBuffer.fromHandle(handle)

            return this.value
        }

        fromArgumentIndex(index: i32): MultiValueManagedArray<T> {
            const numberOfArguments = getNumArguments()
            for (let i = index; i < numberOfArguments - index; i++) {
                const newValue = BaseManagedType.dummy<T>().utils.fromArgumentIndex(i)
                this.value.push(newValue)
            }

            return this.value
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): MultiValueManagedArray<T> {
            return BaseManagedUtils.defaultFromByteReader<MultiValueManagedArray<T>, Utils<T>>(this, retainedPtr, reader)
        }

        fromBytes(bytes: Uint8Array): MultiValueManagedArray<T> {
            return BaseManagedUtils.defaultFromBytes<MultiValueManagedArray<T>>(this, bytes)
        }

        decodeTop(buffer: ManagedBuffer): MultiValueManagedArray<T> {
            const dummy = BaseManagedType.dummy<T>()
            if (dummy.skipsReserialization()) {
                this.value.buffer = buffer
            } else {
                const input = new ManagedBufferNestedDecodeInput(buffer)
                while (input.getRemainingLength() > ManagedU32.zero()) {
                    const decodedValue = BaseManagedType.dummy<T>().utils.decodeNested(input)
                    this.value.push(decodedValue)
                }
            }

            return this.value
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): MultiValueManagedArray<T> {
            const size = ManagedU32.dummy().utils.decodeNested(input)

            for (let i = ManagedU32.zero(); i < size; i++) {
                const decodedValue = BaseManagedType.dummy<T>().utils.decodeNested(input)
                this.value.push(decodedValue)
            }

            return this.value
        }

    }

}
