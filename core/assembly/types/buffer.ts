import { BigUint } from "./bigUint"
import {
  checkIfDebugBreakpointEnabled, checkIfSecondDebugBreakpointEnabled,
  managedSignalError,
  mBufferAppend, mBufferAppendBytes,
  mBufferCopyByteSlice,
  mBufferEq,
  mBufferFinish,
  mBufferFromBigIntUnsigned,
  mBufferGetArgument,
  mBufferGetBytes,
  mBufferGetByteSlice,
  mBufferGetLength, mBufferNew,
  mBufferSetBytes,
  mBufferSetByteSlice,
  mBufferSetRandom,
  mBufferStorageLoad,
  mBufferStorageStore,
  Static
} from "../utils/env"
import {ManagedUnsignedNumber} from "./unsignedNumber"
import {BaseManagedType, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {universalDecodeNumber} from "../utils/math/number";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32, ManagedU64} from "./numbers";
import {Option} from "./option"

@unmanaged
export class ManagedBuffer extends ManagedType {

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get utils(): ManagedBuffer.Utils {
    return ManagedBuffer.Utils.fromValue(this)
  }

  get payloadSize(): ManagedU32 {
    return ManagedU32.fromValue(4)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  skipsReserialization(): boolean {
    return false
  }

  append(value: ManagedBuffer): void {
    mBufferAppend(this.handle, value.handle)
  }

  appendBytes(bytes: Uint8Array): void {
    mBufferAppendBytes(
        this.handle,
        changetype<i32>(bytes.buffer),
        bytes.byteLength
    )
  }

  isEmpty(): bool {
    return this.utils.getBytesLength() == 0
  }

  clone(): ManagedBuffer {
    const resultHandle = mBufferNew()
    const result = ManagedBuffer.fromHandle(resultHandle)
    result.append(this)

    return result
  }

  getHandle(): i32 {
    return this.handle
  }

  write(bytes: Uint8Array): void {
    this.appendBytes(bytes)
  }

  toBytes(): Uint8Array {
    return this.utils.toBytes()
  }

  static new(): ManagedBuffer {
    const handle = Static.nextHandle()
    const emptyBytes = new Uint8Array(0)
    mBufferSetBytes(
        handle,
        changetype<i32>(emptyBytes.buffer),
        emptyBytes.byteLength
    )

    return ManagedBuffer.fromHandle(handle)
  }

  static dummy(): ManagedBuffer {
    return changetype<ManagedBuffer>(0)
  }

  static fromString(str: string): ManagedBuffer {
    const resultHandle = Static.nextHandle()
    const encoded = String.UTF8.encode(str)
    mBufferSetBytes(resultHandle, changetype<i32>(encoded), encoded.byteLength)
    return ManagedBuffer.fromHandle(resultHandle)
  }

  static fromBigUint(biguint: BigUint): ManagedBuffer {
    const handle = Static.nextHandle()
    mBufferFromBigIntUnsigned(handle, biguint.handle)
    return ManagedBuffer.fromHandle(handle)
  }

  static fromHandle(handle: i32): ManagedBuffer {
    return (ManagedBuffer.dummy()).utils.fromHandle(handle)
  }

  static fromBytes(bytes: Uint8Array): ManagedBuffer { //TODO : replace all '.utils.fromBytes' by this when possible
    return ManagedBuffer.dummy().utils.fromBytes(bytes)
  }

  @operator("==")
  static equals(a: ManagedBuffer, b: ManagedBuffer): bool {
    return mBufferEq(a.getHandle(), b.getHandle()) > 0
  }

  @operator('!=')
  static notEquals(a: ManagedBuffer, b: ManagedBuffer): bool {
    return !ManagedBuffer.equals(a, b)
  }
}

export namespace ManagedBuffer {

  @final @unmanaged
  export class Utils extends ManagedUtils<ManagedBuffer> {

    static fromValue(value: ManagedBuffer): Utils {
      return changetype<Utils>(value.handle)
    }

    get value(): ManagedBuffer {
      return changetype<ManagedBuffer>(this)
    }

    finish(): void {
      mBufferFinish(this.value.getHandle())
    }

    storeAtBuffer(key: ManagedBuffer): void {
      mBufferStorageStore(key.getHandle(), this.value.getHandle())
    }

    signalError(): void {
      managedSignalError(this.value.getHandle())
    }

    encodeTop(): ManagedBuffer {
      return this.value.clone()
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      const length = mBufferGetLength(this.value.getHandle());

      (ManagedUnsignedNumber.fromValue<u32>(length as u32)).utils.encodeNested(output)
      const thisBytes = this.toBytes()
      output.write(thisBytes)
    }

    getBytesLength(): i32 {
      return mBufferGetLength(this.value.getHandle())
    }

    toBytes(): Uint8Array {
      let length = this.getBytesLength()
      let bytes = new Uint8Array(length)
      mBufferGetBytes(this.value.getHandle(), changetype<i32>(bytes.buffer))

      return bytes
    }

    toBytesCheckLength(length: ManagedU32): Uint8Array { //TODO : this is a (temporary?) alternative to ManagedByteArray
      if (ManagedU32.fromValue(this.getBytesLength()) != length) {
        throw new Error("invalid bytes length")
      }

      return this.toBytes()
    }

    loadSlice(startPosition: ManagedU32, destSlice: Uint8Array): void {
      const err = mBufferGetByteSlice(
        this.value.getHandle(),
        startPosition.value as i32,
        destSlice.byteLength,
        changetype<i32>(destSlice.buffer)
      )

      if (err !== 0) {
        throw new Error('TODO : (load slice) invalid slice error')
      }
    }

    copySlice(startPosition: ManagedU32, sliceLength: ManagedU32): ManagedBuffer {
      const result = ManagedBuffer.fromHandle(mBufferNew())
      const err = mBufferCopyByteSlice(
          this.value.handle,
          startPosition.value as i32,
          sliceLength.value as i32,
          result.handle
      )

      if (err === 0) {
        return result
      } else {
        throw new Error('TODO : (copy slice) invalid slice error')
      }

    }

    setSlice(startPosition: i32, bytes: Uint8Array): void {
      const err = mBufferSetByteSlice(
        this.value.getHandle(),
        startPosition,
        bytes.byteLength,
        changetype<i32>(bytes.buffer)
      )

      if (err !== 0) {
        ManagedBuffer.fromString('TODO').utils.signalError()
      }
    }

    toU64(): ManagedU64 {
      const length = this.getBytesLength() as u32
      const u64Size = sizeof<u64>() as u32
      if (length > u64Size) {
        throw new Error('TODO : error parsing as u64')
      }

      let bytes = new Uint8Array(length)

      this.loadSlice(
          ManagedU32.zero(),
          bytes
      )

      return ManagedU64.fromValue(
          universalDecodeNumber(
            bytes,
            false
        )
      )
    }

    toString(): string {
      let bytes = this.toBytes()

      return String.UTF8.decode(bytes.buffer)
    }

    toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
      return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
    }

    intoTop<T extends BaseManagedType>(): T {
      return (BaseManagedType.dummy<T>()).utils.decodeTop(this.value)
    }

    fromHandle(handle: i32): ManagedBuffer {
      return changetype<ManagedBuffer>(handle)
    }

    fromArgumentIndex(argIndex: i32): ManagedBuffer {
      const newHandle = Static.nextHandle()
      mBufferGetArgument(argIndex, newHandle)
      return this.fromHandle(newHandle)
    }

    fromStorage(key: ManagedBuffer): ManagedBuffer {
      const newHandle = Static.nextHandle()
      mBufferStorageLoad(key.getHandle(), newHandle)
      return this.fromHandle(newHandle)
    }

    fromRandom(nrBytes: i32): ManagedBuffer {
      const handle = this.value.getHandle()
      if (handle == 0) {
        throw new Error("TODO : should not be called from dummy")
      }
      mBufferSetRandom(this.value.getHandle(), nrBytes)

      return this.value
    }

    fromBytes(bytes: Uint8Array): ManagedBuffer {
      let ptr = changetype<i32>(bytes.buffer)
      const newHandle = Static.nextHandle()
      mBufferSetBytes(newHandle, ptr, bytes.byteLength)

      return this.fromHandle(newHandle)
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedBuffer {
      return BaseManagedUtils.defaultFromByteReader<ManagedBuffer, Utils>(this, retainedPtr, reader)
    }

    decodeTop(buffer: ManagedBuffer): ManagedBuffer {
      const result = ManagedBuffer.new()
      result.append(buffer)

      return result
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): ManagedBuffer {
      const size = ManagedU32.dummy().utils.decodeNested(input)

      const buffer = input.readManagedBufferOfSize(size)

      return buffer
    }

  }
}
