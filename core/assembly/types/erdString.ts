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
import {ElrondUnsignedNumber} from "./elrondUnsignedNumber"
import {BaseManagedType, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {universalDecodeNumber} from "../utils/math/number";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32, ElrondU64} from "./numbers";
import {ArgumentLoader} from "../utils/argumentLoader"
import {TokenIdentifier} from "./tokenIdentifier"

@unmanaged
export class ElrondString extends ManagedType {

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get utils(): ElrondString.Utils {
    return ElrondString.Utils.fromValue(this)
  }

  get payloadSize(): ElrondU32 {
    return ElrondU32.fromValue(4)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  get skipsReserialization(): boolean {
    return false
  }

  append(value: ElrondString): void {
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

  clone(): ElrondString {
    const resultHandle = mBufferNew()
    const result = ElrondString.fromHandle(resultHandle)
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

  static new(): ElrondString {
    const handle = Static.nextHandle()
    const emptyBytes = new Uint8Array(0)
    mBufferSetBytes(
        handle,
        changetype<i32>(emptyBytes.buffer),
        emptyBytes.byteLength
    )

    return ElrondString.fromHandle(handle)
  }

  static dummy(): ElrondString {
    return changetype<ElrondString>(0)
  }

  static fromString(str: string): ElrondString {
    const resultHandle = Static.nextHandle()
    const encoded = String.UTF8.encode(str)
    mBufferSetBytes(resultHandle, changetype<i32>(encoded), encoded.byteLength)
    return ElrondString.fromHandle(resultHandle)
  }

  static fromBigUint(biguint: BigUint): ElrondString {
    const handle = Static.nextHandle()
    mBufferFromBigIntUnsigned(handle, biguint.handle)
    return ElrondString.fromHandle(handle)
  }

  static fromHandle(handle: i32): ElrondString {
    return (ElrondString.dummy()).utils.fromHandle(handle)
  }

  static fromBytes(bytes: Uint8Array): ElrondString { //TODO : replace all '.utils.fromBytes' by this when possible
    return ElrondString.dummy().utils.fromBytes(bytes)
  }

  @operator("==")
  static equals(a: ElrondString, b: ElrondString): bool {
    return mBufferEq(a.getHandle(), b.getHandle()) > 0
  }

  @operator('!=')
  static notEquals(a: ElrondString, b: ElrondString): bool {
    return !ElrondString.equals(a, b)
  }
}

export namespace ElrondString {

  @final @unmanaged
  export class Utils extends ManagedUtils<ElrondString> {

    static fromValue(value: ElrondString): Utils {
      return changetype<Utils>(value.handle)
    }

    get value(): ElrondString {
      return changetype<ElrondString>(this)
    }

    finish(): void {
      mBufferFinish(this.value.getHandle())
    }

    storeAtBuffer(key: ElrondString): void {
      mBufferStorageStore(key.getHandle(), this.value.getHandle())
    }

    signalError(): void {
      managedSignalError(this.value.getHandle())
    }

    encodeTop(): ElrondString {
      return this.value.clone()
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      const length = mBufferGetLength(this.value.getHandle());

      (ElrondUnsignedNumber.fromValue<u32>(length as u32)).utils.encodeNested(output)
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

    toBytesCheckLength(length: ElrondU32): Uint8Array { //TODO : this is a (temporary?) alternative to ManagedByteArray
      if (ElrondU32.fromValue(this.getBytesLength()) != length) {
        throw new Error("invalid bytes length")
      }

      return this.toBytes()
    }

    loadSlice(startPosition: ElrondU32, destSlice: Uint8Array): void {
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

    copySlice(startPosition: ElrondU32, sliceLength: ElrondU32): ElrondString {
      const result = ElrondString.fromHandle(mBufferNew())
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
        ElrondString.fromString('TODO').utils.signalError()
      }
    }

    toU64(): ElrondU64 {
      const length = this.getBytesLength() as u32
      const u64Size = sizeof<u64>() as u32
      if (length > u64Size) {
        throw new Error('TODO : error parsing as u64')
      }

      let bytes = new Uint8Array(length)

      this.loadSlice(
          ElrondU32.zero(),
          bytes
      )

      return ElrondU64.fromValue(
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

    fromHandle(handle: i32): ElrondString {
      return changetype<ElrondString>(handle)
    }

    fromArgument<L extends ArgumentLoader>(loader: L): ElrondString {
      const buffer = loader.getRawArgumentAtIndex(loader.currentIndex)
      loader.currentIndex++

      return buffer
    }

    fromStorage(key: ElrondString): ElrondString {
      const newHandle = Static.nextHandle()
      mBufferStorageLoad(key.getHandle(), newHandle)
      return this.fromHandle(newHandle)
    }

    fromRandom(nrBytes: i32): ElrondString {
      const handle = this.value.getHandle()
      if (handle == 0) {
        throw new Error("TODO : should not be called from dummy")
      }
      mBufferSetRandom(this.value.getHandle(), nrBytes)

      return this.value
    }

    fromBytes(bytes: Uint8Array): ElrondString {
      let ptr = changetype<i32>(bytes.buffer)
      const newHandle = Static.nextHandle()
      mBufferSetBytes(newHandle, ptr, bytes.byteLength)

      return this.fromHandle(newHandle)
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondString {
      return BaseManagedUtils.defaultFromByteReader<ElrondString, Utils>(this, retainedPtr, reader)
    }

    decodeTop(buffer: ElrondString): ElrondString {
      const result = ElrondString.new()
      result.append(buffer)

      return result
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): ElrondString {
      const size = ElrondU32.dummy().utils.decodeNested(input)

      const buffer = input.readManagedBufferOfSize(size)

      return buffer
    }

  }
}
