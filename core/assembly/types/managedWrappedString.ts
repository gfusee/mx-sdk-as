import { ManagedBuffer } from "./buffer"
import { ManagedType } from "./interfaces/managedType"
import { ManagedUtils } from "./interfaces/managedUtils"
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";
import {checkIfDebugBreakpointEnabled} from "../utils/env";

@unmanaged
export abstract class ManagedWrappedString extends ManagedType {

  get buffer(): ManagedBuffer {
    return changetype<ManagedBuffer>(this)
  }

  abstract get utils(): ManagedWrappedString.Utils<ManagedWrappedString>

  get payloadSize(): ManagedU32 {
    return ManagedU32.fromValue(4)
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

    storeAtBuffer(key: ManagedBuffer): void {
      this.value.buffer.utils.storeAtBuffer(key)
    }

    signalError(): void {
      this.value.buffer.utils.signalError()
    }

    encodeTop(): ManagedBuffer {
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

    fromBuffer(buffer: ManagedBuffer): T {
      return changetype<T>(buffer)
    }

    fromString(str: string): void {
      this.value.buffer = ManagedBuffer.fromString(str)
    }

    fromHandle(handle: i32): T {
      return changetype<T>(handle)
    }

    fromArgumentIndex(argIndex: i32): T {
      const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(argIndex)
      return this.fromBuffer(buffer)
    }

    fromStorage(key: ManagedBuffer): T {
      return this.fromBuffer(ManagedBuffer.dummy().utils.fromStorage(key))
    }

    fromBytes(bytes: Uint8Array): T {
      return this.fromBuffer(ManagedBuffer.dummy().utils.fromBytes(bytes))
    }

    decodeTop(buffer: ManagedBuffer): T {
      return this.fromBuffer(buffer)
    }

  }
}
