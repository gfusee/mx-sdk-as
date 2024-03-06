import {
  bigIntAdd,
  bigIntCmp,
  bigIntFinishUnsigned,
  bigIntGetInt64,
  bigIntGetUnsignedArgument,
  bigIntGetUnsignedBytes,
  bigIntMul,
  bigIntSetInt64,
  bigIntSetUnsignedBytes,
  bigIntSub,
  bigIntTDiv,
  bigIntTMod,
  bigIntToString,
  bigIntUnsignedByteLength, checkIfDebugBreakpointEnabled,
  mBufferToBigIntUnsigned,
  Static
} from "../utils/env"
import {ManagedBuffer} from "./buffer"
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";

@final @unmanaged
export class BigUint extends ManagedType {

  constructor() {
    super();
    return changetype<BigUint>(0)
  }

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get utils(): BigUint.Utils {
    return BigUint.Utils.fromValue(this)
  }

  skipsReserialization(): boolean {
    return false
  }

  toU64(): u64 {
    return bigIntGetInt64(this.getHandle()) as u64
  }

  getHandle(): i32 {
    return this.handle
  }

  write(bytes: Uint8Array): void {
    defaultBaseManagedTypeWriteImplementation()
  }

  get payloadSize(): ManagedU32 {
    return ManagedU32.fromValue(4)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  private static getZeroHandle(): i32 {
    const handle = Static.nextHandle()
    bigIntSetInt64(handle, 0)

    return handle
  }

  static dummy(): BigUint {
    return changetype<BigUint>(0)
  }

  static zero(): BigUint {
    const handle = BigUint.getZeroHandle()

    return BigUint.fromHandle(handle)
  }

  static fromHandle(handle: i32): BigUint {
    return changetype<BigUint>(handle)
  }

  static fromU64(value: u64): BigUint {
    let result = BigUint.zero()
    bigIntSetInt64(result.getHandle(), value as i64)

    return result
  }

  static fromManagedBuffer(value: ManagedBuffer): BigUint {
    return BigUint.dummy().utils.fromManagedBuffer(value)
  }

  @operator("+")
  static add(a: BigUint, b: BigUint): BigUint {
    let result = BigUint.zero()
    bigIntAdd(result.getHandle(), a.getHandle(), b.getHandle())
    return result
  }

  @operator("-")
  static sub(a: BigUint, b: BigUint): BigUint {
    let result = BigUint.zero()
    bigIntSub(result.getHandle(), a.getHandle(), b.getHandle())
    return result
  }

  @operator("*")
  static mul(a: BigUint, b: BigUint): BigUint {
    let result = BigUint.zero()
    bigIntMul(result.getHandle(), a.getHandle(), b.getHandle())
    return result
  }

  @operator("/")
  static div(a: BigUint, b: BigUint): BigUint {
    let result = BigUint.zero()
    bigIntTDiv(result.getHandle(), a.getHandle(), b.getHandle())
    return result
  }

  @operator("%")
  static mod(a: BigUint, b: BigUint): BigUint {
    let result = BigUint.zero()
    bigIntTMod(result.getHandle(), a.getHandle(), b.getHandle())
    return result
  }

  @operator("==")
  static equals(a: BigUint, b: BigUint): bool {
    return bigIntCmp(a.getHandle(), b.getHandle()) == 0
  }

  @operator('!=')
  static notEquals(a: BigUint, b: BigUint): bool {
    return !(a == b)
  }

  @operator("<")
  static lessThan(a: BigUint, b: BigUint): bool {
    return bigIntCmp(a.getHandle(), b.getHandle()) == -1
  }

  @operator("<=")
  static lessThanOrEquals(a: BigUint, b: BigUint): bool {
    return !(a > b)
  }

  @operator(">")
  static greaterThan(a: BigUint, b: BigUint): bool {
    return !(a < b) && (a != b)
  }

  @operator(">=")
  static greaterThanOrEquals(a: BigUint, b: BigUint): bool {
    return !(a < b)
  }

  @operator.postfix("++")
  add(): BigUint {
    return BigUint.add(this, BigUint.fromU64(1))
  }

}

export namespace BigUint {

  @final @unmanaged
  export class Utils extends ManagedUtils<BigUint> {

    static fromValue(value: BigUint): Utils {
      return changetype<Utils>(value.handle)
    }

    get value(): BigUint {
      return changetype<BigUint>(this)
    }

    storeAtBuffer(key: ManagedBuffer): void {
      let valueBuffer = ManagedBuffer.fromBigUint(this.value)
      valueBuffer.utils.storeAtBuffer(key)
    }

    signalError(): void {
      const buffer = this.toManagedBuffer()
      buffer.utils.signalError()
    }

    finish(): void {
      bigIntFinishUnsigned(this.value.getHandle())
    }

    encodeTop(): ManagedBuffer {
      return ManagedBuffer.fromBigUint(this.value)
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      const length = bigIntUnsignedByteLength(this.value.getHandle());
      (ManagedU32.fromValue(length)).utils.encodeNested(output)
      output.write(this.toBytes())
    }

    toString(): string {
      let handle = Static.nextHandle()
      bigIntToString(this.value.getHandle(), handle)
      return ManagedBuffer.fromHandle(handle).utils.toString()
    }

    toManagedBuffer(): ManagedBuffer {
      const resultHandle = Static.nextHandle()
      bigIntToString(this.value.getHandle(), resultHandle)

      return ManagedBuffer.fromHandle(resultHandle)
    }

    toBytes(): Uint8Array {
      const length = bigIntUnsignedByteLength(this.value.getHandle())
      const bytes = new Uint8Array(length)
      bigIntGetUnsignedBytes(this.value.getHandle(), changetype<i32>(bytes.buffer))

      return bytes
    }

    toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
      return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
    }

    fromHandle(handle: i32): BigUint {
      return BigUint.fromHandle(handle)
    }

    fromStorage(key: ManagedBuffer): void {
      const buffer = ManagedBuffer.dummy().utils.fromStorage(key)
      this.fromManagedBuffer(buffer)
    }

    fromArgumentIndex(index: i32): BigUint {
      const newHandle = Static.nextHandle()
      bigIntGetUnsignedArgument(index, newHandle)

      return this.fromHandle(newHandle)
    }

    fromManagedBuffer(buffer: ManagedBuffer): BigUint {
      const result = BigUint.zero()
      mBufferToBigIntUnsigned(buffer.getHandle(), result.getHandle())

      return result
    }

    fromBytes(bytes: Uint8Array): void {
      bigIntSetUnsignedBytes(this.value.getHandle(), changetype<i32>(bytes.buffer), bytes.byteLength)
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): BigUint {
      return BaseManagedUtils.defaultFromByteReader<BigUint, Utils>(this, retainedPtr, reader)
    }

    decodeTop(buffer: ManagedBuffer): BigUint {
      return this.fromManagedBuffer(buffer)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): BigUint {
      return input.readBigUint()
    }

  }

}
