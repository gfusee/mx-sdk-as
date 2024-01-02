import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils";
import {ElrondString} from "./erdString";
import {
    __frameworkGetRetainedClosureValue,
    __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue,
    getNumArguments
} from "../utils/env";
import {ElrondArray} from "./elrondArray";
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";

@unmanaged
export class MultiValueEncoded<T extends ManagedType> extends BaseManagedType {

    __rawBuffer: ElrondArray<ElrondString> | null = null

    get rawBuffer(): ElrondArray<ElrondString> {
        if (this.__rawBuffer) {
            return this.__rawBuffer!
        } else {
            this.__rawBuffer = new ElrondArray<ElrondString>()
            return this.__rawBuffer!
        }
    }

    set rawBuffer(value: ElrondArray<ElrondString>) {
        this.__rawBuffer = value
    }

    get utils(): MultiValueEncoded.Utils<T> {
        return new MultiValueEncoded.Utils<T>(this);
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
        return this.rawBuffer.getHandle();
    }

    push(item: T): void {
        this.rawBuffer.push(item.utils.encodeTop())
    }

    toElrondArray(): ElrondArray<T> {
        const result = new ElrondArray<T>()
        const rawBufferLength = this.rawBuffer.getLength()
        for (let i = ElrondU32.zero(); i < rawBufferLength; i++) {
            const item = this.rawBuffer.get(i)
            const newValue = BaseManagedType.dummy<T>().utils.decodeTop(item)
            result.push(newValue)
        }

        return result
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static fromArray<T extends BaseManagedType>(array: ElrondArray<ElrondString>): MultiValueEncoded<T> {
        const result = new MultiValueEncoded<T>()

        result.__rawBuffer = array

        return result
    }

}

export namespace MultiValueEncoded {

    @final @unmanaged
    export class Utils<T extends ManagedType> extends BaseManagedUtils<MultiValueEncoded<T>> {

        constructor(
            private _value: MultiValueEncoded<T>
        ) {
            super()
        }

        get value(): MultiValueEncoded<T> {
            return this._value
        }

        storeAtBuffer(key: ElrondString): void {
            this.value.rawBuffer.utils.storeAtBuffer(key)
        }

        signalError(): void {
            this.value.rawBuffer.utils.signalError()
        }

        toString(): string {
            return this.value.rawBuffer.utils.toString()
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils<T>, R>(this, retainedPtr, writer)
        }

        finish(): void {
            this.value.rawBuffer.forEach(item => item.utils.finish())
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): MultiValueEncoded<T> {
            return BaseManagedUtils.defaultFromByteReader<MultiValueEncoded<T>, Utils<T>>(this, retainedPtr, reader)
        }

        fromBytes(bytes: Uint8Array): MultiValueEncoded<T> {
            return BaseManagedUtils.defaultFromBytes<MultiValueEncoded<T>>(this, bytes)
        }

        fromHandle(handle: i32): MultiValueEncoded<T> {
            this.value.rawBuffer = ElrondArray.fromBuffer<ElrondString>(ElrondString.fromHandle(handle))

            return this
        }

        fromArgumentIndex(index: i32): MultiValueEncoded<T> {
            const numberOfArguments = getNumArguments()
            for (let i = index; i < numberOfArguments; i++) {
                const newRawBuffer = ElrondString.dummy().utils.fromArgumentIndex(i)
                this.value.rawBuffer.push(newRawBuffer)
            }

            return this.value
        }

        encodeTop(): ElrondString {
            return this.value.rawBuffer.utils.encodeTop()
        }

        encodeNested<T extends NestedEncodeOutput>(output: T): void {
            this.value.rawBuffer.utils.encodeNested(output)
        }

        decodeTop(buffer: ElrondString): MultiValueEncoded<T> {
            this.value.rawBuffer = ElrondArray.dummy<ElrondString>().utils.decodeTop(buffer)

            return this.value
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): MultiValueEncoded<T> {
            this.value.rawBuffer = ElrondArray.dummy<ElrondString>().utils.decodeNested(input)

            return this.value
        }
    }
}
