
import { ManagedBuffer } from "./buffer";
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils";
import {ManagedArray} from "./managedArray";
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";

@unmanaged
export abstract class MultiValue extends BaseManagedType {

    items: ManagedArray<ManagedBuffer>

    protected constructor() {
        super()

        this.items = new ManagedArray<ManagedBuffer>()
    }

    private _bufferCache: ManagedBuffer | null = null

    skipsReserialization(): boolean {
        return false
    }

    getHandle(): i32 {
        if (this._bufferCache) {
            return this._bufferCache!.getHandle()
        } else {
            const buffer = this.utils.encodeTop()
            this._bufferCache = buffer
            return buffer.getHandle()
        }
    }

    get payloadSize(): ManagedU32 {
        return ManagedU32.fromValue(4)
    }

    get shouldBeInstantiatedOnHeap(): boolean {
        return true
    }

    get hasHandle(): bool {
        return true
    }

    protected pushItem<T extends BaseManagedType>(item: T): void {
        this.items.push(item.utils.encodeTop())
    }

    protected getItem<T extends BaseManagedType>(index: ManagedU32): T {
        return this.items.get(index).utils.intoTop<T>()
    }

    protected decodeNestedAndPushItem<T extends BaseManagedType>(input: ManagedBufferNestedDecodeInput): void {
        const item = BaseManagedType.dummy<T>().utils.decodeNested(input)
        this.pushItem<T>(item)
    }

    abstract encodeNested(output: NestedEncodeOutput): void

    abstract decodeNested(input: ManagedBufferNestedDecodeInput): this

}

@unmanaged
export class MultiValue1<A extends BaseManagedType> extends MultiValue {

    protected constructor() {
        super()
    }

    get utils(): MultiValue.Utils<MultiValue1<A>> {
        return new MultiValue.Utils<MultiValue1<A>>(this)
    }

    get a(): A {
        return this.getItem<A>(ManagedU32.fromValue(0))
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from<A extends BaseManagedType>(a: A): MultiValue1<A> {
        const result = new MultiValue1<A>()
        result.pushItem<A>(a)

        return result
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
        this.a.utils.encodeNested(output)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): MultiValue1<A> {
        this.decodeNestedAndPushItem<A>(input)

        return this
    }

}

@unmanaged
export class MultiValue2<A extends BaseManagedType, B extends BaseManagedType> extends MultiValue {

    protected constructor() {
        super()
    }

    get utils(): MultiValue.Utils<MultiValue2<A, B>> {
        return new MultiValue.Utils<MultiValue2<A, B>>(this)
    }

    get a(): A {
        return this.getItem<A>(ManagedU32.fromValue(0))
    }

    get b(): B {
        return this.getItem<B>(ManagedU32.fromValue(1))
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from<A extends BaseManagedType, B extends BaseManagedType>(a: A, b: B): MultiValue2<A, B> {
        const result = new MultiValue2<A, B>()
        result.pushItem<A>(a);
        result.pushItem<B>(b)

        return result
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
        this.a.utils.encodeNested(output)
        this.b.utils.encodeNested(output)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): MultiValue2<A, B> {
        this.decodeNestedAndPushItem<A>(input)
        this.decodeNestedAndPushItem<B>(input)

        return this
    }

}

@unmanaged
export class MultiValue3<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType> extends MultiValue {

    protected constructor() {
        super()
    }

    get utils(): MultiValue.Utils<MultiValue3<A, B, C>> {
        return new MultiValue.Utils<MultiValue3<A, B, C>>(this)
    }

    get a(): A {
        return this.getItem<A>(ManagedU32.fromValue(0))
    }

    get b(): B {
        return this.getItem<B>(ManagedU32.fromValue(1))
    }

    get c(): C {
        return this.getItem<C>(ManagedU32.fromValue(2))
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType>(a: A, b: B, c: C): MultiValue3<A, B, C> {
        const result = new MultiValue3<A, B, C>()
        result.pushItem<A>(a)
        result.pushItem<B>(b)
        result.pushItem<C>(c)

        return result
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
        this.a.utils.encodeNested(output)
        this.b.utils.encodeNested(output)
        this.c.utils.encodeNested(output)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): MultiValue3<A, B, C> {
        this.decodeNestedAndPushItem<A>(input)
        this.decodeNestedAndPushItem<B>(input)
        this.decodeNestedAndPushItem<C>(input)

        return this
    }

}

@unmanaged
export class MultiValue4<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType, D extends BaseManagedType> extends MultiValue {

    protected constructor() {
        super()
    }

    get utils(): MultiValue.Utils<MultiValue4<A, B, C, D>> {
        return new MultiValue.Utils<MultiValue4<A, B, C, D>>(this)
    }

    get a(): A {
        return this.getItem<A>(ManagedU32.fromValue(0))
    }

    get b(): B {
        return this.getItem<B>(ManagedU32.fromValue(1))
    }

    get c(): C {
        return this.getItem<C>(ManagedU32.fromValue(2))
    }

    get d(): D {
        return this.getItem<D>(ManagedU32.fromValue(3))
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType, D extends BaseManagedType>(a: A, b: B, c: C, d: D): MultiValue4<A, B, C, D> {
        const result = new MultiValue4<A, B, C, D>()
        result.pushItem<A>(a)
        result.pushItem<B>(b)
        result.pushItem<C>(c)
        result.pushItem<D>(d)

        return result
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
        this.a.utils.encodeNested(output)
        this.b.utils.encodeNested(output)
        this.c.utils.encodeNested(output)
        this.d.utils.encodeNested(output)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): MultiValue4<A, B, C, D> {
        this.decodeNestedAndPushItem<A>(input)
        this.decodeNestedAndPushItem<B>(input)
        this.decodeNestedAndPushItem<C>(input)
        this.decodeNestedAndPushItem<D>(input)

        return this
    }

}

@unmanaged
export class MultiValue5<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType, D extends BaseManagedType, E extends BaseManagedType> extends MultiValue {

    protected constructor() {
        super()
    }

    get utils(): MultiValue.Utils<MultiValue5<A, B, C, D, E>> {
        return new MultiValue.Utils<MultiValue5<A, B, C, D, E>>(this)
    }

    get a(): A {
        return this.getItem<A>(ManagedU32.fromValue(0))
    }

    get b(): B {
        return this.getItem<B>(ManagedU32.fromValue(1))
    }

    get c(): C {
        return this.getItem<C>(ManagedU32.fromValue(2))
    }

    get d(): D {
        return this.getItem<D>(ManagedU32.fromValue(3))
    }

    get e(): E {
        return this.getItem<E>(ManagedU32.fromValue(4))
    }

    write(bytes: Uint8Array): void {
        defaultBaseManagedTypeWriteImplementation()
    }

    static from<A extends BaseManagedType, B extends BaseManagedType, C extends BaseManagedType, D extends BaseManagedType, E extends BaseManagedType>(a: A, b: B, c: C, d: D, e: E): MultiValue5<A, B, C, D, E> {
        const result = new MultiValue5<A, B, C, D, E>()
        result.pushItem<A>(a)
        result.pushItem<B>(b)
        result.pushItem<C>(c)
        result.pushItem<D>(d)
        result.pushItem<E>(e)

        return result
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
        this.a.utils.encodeNested(output)
        this.b.utils.encodeNested(output)
        this.c.utils.encodeNested(output)
        this.d.utils.encodeNested(output)
        this.e.utils.encodeNested(output)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): MultiValue5<A, B, C, D, E> {
        this.decodeNestedAndPushItem<A>(input)
        this.decodeNestedAndPushItem<B>(input)
        this.decodeNestedAndPushItem<C>(input)
        this.decodeNestedAndPushItem<D>(input)
        this.decodeNestedAndPushItem<E>(input)

        return this
    }

}

export namespace MultiValue {

    @unmanaged
    export class Utils<T extends MultiValue> extends BaseManagedUtils<T> {

        constructor(
            private _value: T
        ) {
            super();
        }

        get value(): T {
            return this._value
        }

        storeAtBuffer(key: ManagedBuffer): void {
            const buffer = ManagedBuffer.new()
            this.encodeNested(buffer)
            buffer.utils.storeAtBuffer(key)
        }

        signalError(): void {
            const buffer = ManagedBuffer.new()
            this.encodeNested(buffer)
            buffer.utils.signalError()
        }

        encodeTop(): ManagedBuffer {
            const buffer = ManagedBuffer.new()
            this.encodeNested(buffer)

            return buffer
        }

        encodeNested<O extends NestedEncodeOutput>(output: O): void {
            this.value.encodeNested(output)
        }

        toString(): string {
            const output = ManagedBuffer.new()
            this.encodeNested(output)
            return output.utils.toString()
        }

        toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
            return BaseManagedUtils.defaultToByteWriter<Utils<T>, R>(this, retainedPtr, writer)
        }

        finish(): void {
            const output = ManagedBuffer.new()
            this.encodeNested(output)
            output.utils.finish()
        }

        fromHandle(handle: i32): T {
            const buffer = ManagedBuffer.fromHandle(handle)

            return this.decodeTop(buffer)
        }

        fromArgumentIndex(index: i32): T {
            const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(index)

            return this.decodeTop(buffer)
        }

        fromBytes(bytes: Uint8Array): T {
            return BaseManagedUtils.defaultFromBytes<T>(this, bytes)
        }

        fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): T {
            return BaseManagedUtils.defaultFromByteReader<T, Utils<T>>(this, retainedPtr, reader)
        }

        decodeTop(buffer: ManagedBuffer): T {
            const input = new ManagedBufferNestedDecodeInput(buffer)
            return this.decodeNested(input)
        }

        decodeNested(input: ManagedBufferNestedDecodeInput): T {
            return this.value.decodeNested(input)
        }

    }

}
