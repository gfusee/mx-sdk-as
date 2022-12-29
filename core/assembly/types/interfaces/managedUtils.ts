import {ElrondString} from "../erdString"
import {ManagedBufferNestedDecodeInput} from "../managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./nestedEncodeOutput";
import {BaseManagedType, ManagedType} from "./managedType";
import {ElrondU32} from "../numbers";
import {checkIfDebugBreakpointEnabled, checkIfSecondDebugBreakpointEnabled} from "../../utils/env";
import {ArgumentLoader} from "../../utils/argumentLoader"
import {TokenIdentifier} from "../tokenIdentifier"

@unmanaged
export abstract class IManagedUtils {
    abstract get value(): BaseManagedType

    abstract fromBytes(bytes: Uint8Array): void

    abstract toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R

    abstract fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): this

    abstract storeAtBuffer(key: ElrondString): void //TODO : Use StorageKey when not allocated on heap

    abstract signalError(): void

    abstract encodeTop(): ElrondString // TODO : optimize by using TopEncodeOutput like in rust

    abstract encodeNested<T extends NestedEncodeOutput>(output: T): void

    abstract toString(): string

    abstract finish(): void

    abstract fromHandle(handle: i32): BaseManagedType

    abstract fromArgument<L extends ArgumentLoader>(loader: L): BaseManagedType

    abstract decodeTop(buffer: ElrondString): BaseManagedType // TODO : optimize by using TopDecodeInput like in rust

    abstract decodeNested(input: ManagedBufferNestedDecodeInput): BaseManagedType //TODO : use generic NestedDecodeInput
}

@unmanaged
export abstract class BaseManagedUtils<T extends BaseManagedType> extends IManagedUtils {

    //Method overriding have strange behaviors when working with changetype and generics, so we use default static methods

    static defaultToByteWriter<T extends IManagedUtils, R>(utils: T, retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
        return ElrondU32.fromValue(utils.value.getHandle()).utils.toByteWriter<R>(retainedPtr, writer)
    }

    static defaultFromByteReader<M extends BaseManagedType, T extends BaseManagedUtils<M>>(utils: T, retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): M {
        const handle = ElrondU32.dummy().utils.fromByteReader(retainedPtr, reader)
        return utils.fromHandle(handle.value)
    }

    static defaultFromBytes<T extends BaseManagedType>(utils: BaseManagedUtils<T>, bytes: Uint8Array): T {
        const buffer = ElrondString.fromBytes(bytes)
        return utils.fromHandle(buffer.getHandle())
    }

    abstract get value(): T

    abstract fromBytes(bytes: Uint8Array): T

    abstract toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R

    abstract fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): T

    abstract fromHandle(handle: i32): T

    abstract fromArgument<L extends ArgumentLoader>(loader: L): T

    abstract decodeTop(buffer: ElrondString): T // TODO : optimize by using TopDecodeInput like in rust

    abstract decodeNested(input: ManagedBufferNestedDecodeInput): T //TODO : use generic NestedDecodeInput

}

@unmanaged
export abstract class ManagedUtils<T extends ManagedType> extends BaseManagedUtils<T> {
    constructor() {
        super();
        throw new Error("Please use static method (utils).")
    }
}
