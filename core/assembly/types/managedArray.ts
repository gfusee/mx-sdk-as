import { ManagedBuffer } from "./buffer";
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation} from "./interfaces/managedType"
import {BaseManagedUtils} from "./interfaces/managedUtils";
import {Option} from "./option";
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers"
import {MultiValueEncoded} from "./multiValueEncoded";

const INDEX_OUT_OF_RANGE_MSG = "ManagedVec index out of range"

//TODO : make it allocated on the stack... but how to deal with the generic bug?
// An idea : remove ManagedUtils class and move all methods in ManagedType
@unmanaged
export class ManagedArray<T extends BaseManagedType> extends BaseManagedType {

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

    get utils(): ManagedArray.Utils<T> {
        return new ManagedArray.Utils<T>(this)
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

    remove(index: ManagedU32): void {
        let length = this.getLength()
        if (index >= length) {
            throw new Error(INDEX_OUT_OF_RANGE_MSG)
        }

        let partBefore: ManagedArray<T>

        if (index > ManagedU32.zero()) {
            partBefore = this.slice(ManagedU32.zero(), index)
        } else {
            partBefore = ManagedArray.new<T>()
        }

        let partAfter: ManagedArray<T>

        if (index < length) {
            partAfter = this.slice(index + ManagedU32.fromValue(1), length)
        } else {
            partAfter = ManagedArray.new<T>()
        }

        this.buffer = partBefore.buffer
        this.buffer.append(partAfter.buffer)
    }

    slice(startIndex: ManagedU32, endIndex: ManagedU32): ManagedArray<T> {
        const bytesStart = startIndex * BaseManagedType.dummy<T>().payloadSize
        const bytesEnd = endIndex * BaseManagedType.dummy<T>().payloadSize

        const buffer = this.buffer.utils.copySlice(
            bytesStart,
            bytesEnd - bytesStart
        )

        return ManagedArray.fromBuffer<T>(buffer)
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

    intoMultiValueEncoded(): MultiValueEncoded<T> {
        const result = new MultiValueEncoded<T>()

        const thisLength = this.getLength()
        for (let i = ManagedU32.zero(); i < thisLength; i++) {
            result.push(this.get(i))
        }

        return result
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static new<T extends BaseManagedType>(): ManagedArray<T> {
        return new ManagedArray<T>()
    }

    static fromSingleItem<T extends BaseManagedType>(item: T): ManagedArray<T> {
        const result = ManagedArray.new<T>()
        result.push(item)

        return result
    }

    static fromBuffer<T extends BaseManagedType>(buffer: ManagedBuffer): ManagedArray<T> {
        const result = ManagedArray.new<T>()
        result.buffer = buffer

        return result
    }

    static fromArrayOfBytes(bytes: Array<Uint8Array>): ManagedArray<ManagedBuffer> {
        const result = ManagedArray.new<ManagedBuffer>()
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

export namespace ManagedArray {

    @unmanaged
    export class Utils<T extends BaseManagedType> extends BaseManagedUtils<ManagedArray<T>> {

        constructor(private _value: ManagedArray<T>) {
            super();
        }

        get value(): ManagedArray<T> {
            return this._value
        }

        storeAtBuffer(key: ManagedBuffer): void {
            this.encodeTop().utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.value.buffer.utils.signalError()
        }

        finish(): void {
            this.encodeTop().utils.finish()
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

        encodeWithoutLength<O extends NestedEncodeOutput>(output: O): void {
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
            return BaseManagedUtils.defaultToByteWriter<Utils<T>, R>(this, retainedPtr, writer)
        }

        fromHandle(handle: i32): ManagedArray<T> {
            this.value.buffer = ManagedBuffer.fromHandle(handle)

            return this.value
        }

        fromArgumentIndex(index: i32): ManagedArray<T> {
            return this.decodeTop(ManagedBuffer.dummy().utils.fromArgumentIndex(index))
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedArray<T> {
            return BaseManagedUtils.defaultFromByteReader<ManagedArray<T>, Utils<T>>(this, retainedPtr, reader)
        }

        fromBytes(bytes: Uint8Array): ManagedArray<T> {
            return BaseManagedUtils.defaultFromBytes<ManagedArray<T>>(this, bytes)
        }

        decodeTop(buffer: ManagedBuffer): ManagedArray<T> {
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

        decodeNested(input: ManagedBufferNestedDecodeInput): ManagedArray<T> {
            const size = ManagedU32.dummy().utils.decodeNested(input)

            for (let i = ManagedU32.zero(); i < size; i++) {
                const decodedValue = BaseManagedType.dummy<T>().utils.decodeNested(input)
                this.value.push(decodedValue)
            }

            return this.value
        }

    }

}
