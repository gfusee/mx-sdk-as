import { ElrondString } from "./erdString"
import { ManagedType } from "./interfaces/managedType"
import { ManagedUtils } from "./interfaces/managedUtils"
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";
import {checkIfDebugBreakpointEnabled} from "../utils/env";
import {ArgumentLoader} from "../utils/argumentLoader"
import {TokenIdentifier} from "./tokenIdentifier"

@unmanaged
export abstract class ManagedWrappedString extends ManagedType {

  get buffer(): ElrondString {
    return changetype<ElrondString>(this)
  }

  abstract get utils(): ManagedWrappedString.Utils<ManagedWrappedString>

  get payloadSize(): ElrondU32 {
    return ElrondU32.fromValue(4)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  getHandle(): i32 {
    return this.buffer.getHandle()
  }

  clone(): this {
    const clonedBuffer = this.buffer.clone()
    const result = instantiate<this>()
    result.buffer = clonedBuffer

    return result
  }

  toByteWriter<R>(writer: (bytes: Uint8Array) => R): R {
    return this.bufferutils.toByteWriter<R>(writer)
  }

  @operator("==")
  static equals(a: ManagedWrappedString, b: ManagedWrappedString): bool {
    return a.buffer == b.buffer
  }

  @operator('!=')
  static notEquals(a: ManagedWrappedString, b: ManagedWrappedString): bool {
    return !(a == b)
  }
}

export namespace ManagedWrappedString {

  @unmanaged
  export abstract class Utils<T extends ManagedWrappedString> extends ManagedUtils<ManagedWrappedString> {

    finish(): void {
      this.value.buffer.utils.finish()
    }

    storeAtBuffer(key: ElrondString): void {
      this.value.buffer.utils.storeAtBuffer(key)
    }

    signalError(): void {
      this.value.buffer.utils.signalError()
    }

    encodeTop(): ElrondString {
      return this.value.buffer
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      this.value.buffer.utils.encodeNested(output)
    }

    toBytes(): Uint8Array {
      return this.value.buffer.utils.toBytes()
    }

    toString(): string {
      return this.value.buffer.utils.toString()
    }

    fromBuffer(buffer: ElrondString): T {
      return changetype<T>(buffer)
    }

    fromString(str: string): void {
      this.value.buffer = ElrondString.fromString(str)
    }

    fromHandle(handle: i32): T {
      return changetype<T>(handle)
    }

    fromArgument<L extends ArgumentLoader>(loader: L): ManagedWrappedString {
      const buffer = loader.getRawArgumentAtIndex(loader.currentIndex)
      loader.currentIndex++

      return this.fromBuffer(buffer)
    }

    fromStorage(key: ElrondString): T {
      return this.fromBuffer(ElrondString.dummy().utils.fromStorage(key))
    }

    fromBytes(bytes: Uint8Array): T {
      return this.fromBuffer(ElrondString.dummy().utils.fromBytes(bytes))
    }

    decodeTop(buffer: ElrondString): T {
      return this.fromBuffer(buffer)
    }

  }
}
