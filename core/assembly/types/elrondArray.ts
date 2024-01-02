import { ElrondString } from "./erdString";
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation} from "./interfaces/managedType"
import {BaseManagedUtils} from "./interfaces/managedUtils";
import {Option} from "./option";
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers"
import {MultiValueEncoded} from "./multiValueEncoded";

const INDEX_OUT_OF_RANGE_MSG = "ManagedVec index out of range"

//TODO : make it allocated on the stack... but how to deal with the generic bug?
// An idea : remove ManagedUtils class and move all methods in ManagedType
@unmanaged
export class ElrondArray<T extends BaseManagedType> extends BaseManagedType {

    __buffer: ElrondString | null = null

    get buffer(): ElrondString {
        if (this.__buffer) {
            return this.__buffer!
        } else {
            this.__buffer = ElrondString.new()
            return this.__buffer!
        }
    }

    set buffer(value: ElrondString) {
        this.__buffer = value
    }

    get utils(): ElrondArray.Utils<T> {
        return new ElrondArray.Utils<T>(this)
    }

    private _valuePayloadSizeCache: ElrondU32 | null = null

    get valuePayloadSize(): ElrondU32 {
        if (this._valuePayloadSizeCache) {
            return this._valuePayloadSizeCache!
        } else {
            const result = BaseManagedType.dummy<T>().payloadSize
            this._valuePayloadSizeCache = result
            return result
        }
    }

    get payloadSize(): ElrondU32 {
        return ElrondU32.fromValue(4)
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

    get(index: ElrondU32): T {
        const payloadSize = this.valuePayloadSize.value
        const byteIndex = index.value * payloadSize
        const value = BaseManagedType.dummy<T>().utils.fromByteReader([byteIndex, changetype<i32>(this.buffer)], (retainedPtr, bytes) => {
            const byteIndexRef = retainedPtr[0]
            const bufferRef = changetype<ElrondString>(retainedPtr[1])

            bufferRef.utils.loadSlice(ElrondU32.fromValue(byteIndexRef), bytes)
        })

        return value
    }

    remove(index: ElrondU32): void {
        let length = this.getLength()
        if (index >= length) {
            throw new Error(INDEX_OUT_OF_RANGE_MSG)
        }

        let partBefore: ElrondArray<T>

        if (index > ElrondU32.zero()) {
            partBefore = this.slice(ElrondU32.zero(), index)
        } else {
            partBefore = ElrondArray.new<T>()
        }

        let partAfter: ElrondArray<T>

        if (index < length) {
            partAfter = this.slice(index + ElrondU32.fromValue(1), length)
        } else {
            partAfter = ElrondArray.new<T>()
        }

        this.buffer = partBefore.buffer
        this.buffer.append(partAfter.buffer)
    }

    slice(startIndex: ElrondU32, endIndex: ElrondU32): ElrondArray<T> {
        const bytesStart = startIndex * BaseManagedType.dummy<T>().payloadSize
        const bytesEnd = endIndex * BaseManagedType.dummy<T>().payloadSize

        const buffer = this.buffer.utils.copySlice(
            bytesStart,
            bytesEnd - bytesStart
        )

        return ElrondArray.fromBuffer<T>(buffer)
    }

    tryGet(index: ElrondU32): Option<T> { //TODO : not optimized
        const length = this.getLength()

        if (index >= length) {
            return Option.null<T>()
        } else {
            return Option.withValue(this.get(index))
        }
    }

    push(value: T): void {
        value.utils.toByteWriter<void>([changetype<i32>(this.buffer)], (retainedPtr, bytes) => {
            const buffer = changetype<ElrondString>(retainedPtr[0])
            buffer.appendBytes(bytes)
        })
    }

    appendArray(array: ElrondArray<T>): void {
        this.buffer.append(array.buffer)
    }

    getLength(): ElrondU32 {
        return ElrondU32.fromValue(this.buffer.utils.getBytesLength() / this.valuePayloadSize.value)
    }

    isEmpty(): bool {
        return this.buffer.utils.getBytesLength() == 0
    }

    forEach(action: (item: T) => void): void {
        const length = this.getLength()

        for (let i = ElrondU32.zero(); i < length; i++) {
            const item = this.get(i)
            action(item)
        }
    }

    intoMultiValueEncoded(): MultiValueEncoded<T> {
        const result = new MultiValueEncoded<T>()

        const thisLength = this.getLength()
        for (let i = ElrondU32.zero(); i < thisLength; i++) {
            result.push(this.get(i))
        }

        return result
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static new<T extends BaseManagedType>(): ElrondArray<T> {
        return new ElrondArray<T>()
    }

    static fromSingleItem<T extends BaseManagedType>(item: T): ElrondArray<T> {
        const result = ElrondArray.new<T>()
        result.push(item)

        return result
    }

    static fromBuffer<T extends BaseManagedType>(buffer: ElrondString): ElrondArray<T> {
        const result = ElrondArray.new<T>()
        result.buffer = buffer

        return result
    }

    static fromArrayOfBytes(bytes: Array<Uint8Array>): ElrondArray<ElrondString> {
        const result = ElrondArray.new<ElrondString>()
        for (let i = 0; i < bytes.length; i++) {
            result.push(ElrondString.dummy().utils.fromBytes(bytes[i]))
        }

        return result
    }

    @operator("[]")
    __get(index: i32): T {
        return this.get(ElrondU32.fromValue(index as u32))
    }

    @operator("[]=")
    __set(index: i32, value: T): void {
        return this.set(index, value)
    }

}

export namespace ElrondArray {

    @unmanaged
    export class Utils<T extends BaseManagedType> extends BaseManagedUtils<ElrondArray<T>> {

        constructor(private _value: ElrondArray<T>) {
            super();
        }

        get value(): ElrondArray<T> {
            return this._value
        }

        storeAtBuffer(key: ElrondString): void {
            this.encodeTop().utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.value.buffer.utils.signalError()
        }

        finish(): void {
            this.encodeTop().utils.finish()
        }

        encodeTop(): ElrondString {
            const dummy = BaseManagedType.dummy<T>()
            if (dummy.skipsReserialization()) {
                return this.value.buffer.clone()
            } else {
                const output = ElrondString.new()
                this.encodeWithoutLength(output);
                return output
            }
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            const length = this.value.getLength().value;
            (ElrondU32.fromValue(length)).utils.encodeNested(output)

            this.encodeWithoutLength(output)
        }

        encodeWithoutLength<O extends NestedEncodeOutput>(output: O): void {
            const length = this.value.getLength()
            for (let i = ElrondU32.zero(); i < length; i++) {
                const value = this.value.get(i)
                value.utils.encodeNested(output)
            }
        }

        toString(): string {
            let string = ''
            const valueLength = this.value.getLength()
            for (let i = ElrondU32.zero(); i < valueLength; i++) {
                const value = this.value.get(i)
                string = string + `${i.value} : ${value.utils.toString()}`
            }

            return string
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils<T>, R>(this, retainedPtr, writer)
        }

        fromHandle(handle: i32): ElrondArray<T> {
            this.value.buffer = ElrondString.fromHandle(handle)

            return this.value
        }

        fromArgumentIndex(index: i32): ElrondArray<T> {
            return this.decodeTop(ElrondString.dummy().utils.fromArgumentIndex(index))
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondArray<T> {
            return BaseManagedUtils.defaultFromByteReader<ElrondArray<T>, Utils<T>>(this, retainedPtr, reader)
        }

        fromBytes(bytes: Uint8Array): ElrondArray<T> {
            return BaseManagedUtils.defaultFromBytes<ElrondArray<T>>(this, bytes)
        }

        decodeTop(buffer: ElrondString): ElrondArray<T> {
            const dummy = BaseManagedType.dummy<T>()
            if (dummy.skipsReserialization()) {
                this.value.buffer = buffer
            } else {
                const input = new ManagedBufferNestedDecodeInput(buffer)
                while (input.getRemainingLength() > ElrondU32.zero()) {
                    const decodedValue = BaseManagedType.dummy<T>().utils.decodeNested(input)
                    this.value.push(decodedValue)
                }
            }

            return this.value
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): ElrondArray<T> {
            const size = ElrondU32.dummy().utils.decodeNested(input)

            for (let i = ElrondU32.zero(); i < size; i++) {
                const decodedValue = BaseManagedType.dummy<T>().utils.decodeNested(input)
                this.value.push(decodedValue)
            }

            return this.value
        }

    }

}
