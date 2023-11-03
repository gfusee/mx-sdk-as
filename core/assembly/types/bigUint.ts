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
import {ElrondString} from "./erdString"
import {BaseManagedType, ManagedType} from "./interfaces/managedType"
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";

@final @unmanaged
export class BigUint extends ManagedType {

  constructor() {
    super();
    return changetype<BigUint>(0)
  }

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get skipsReserialization(): boolean {
    return false
  }

  get utils(): BigUint.Utils {
    return BigUint.Utils.fromValue(this)
  }

  toU64(): u64 {
    return bigIntGetInt64(this.getHandle()) as u64
  }

  getHandle(): i32 {
    return this.handle
  }

  get payloadSize(): ElrondU32 {
    return ElrondU32.fromValue(4)
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

  static fromElrondString(value: ElrondString): BigUint {
    return BigUint.dummy().utils.fromElrondString(value)
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

    storeAtBuffer(key: ElrondString): void {
      let valueBuffer = ElrondString.fromBigUint(this.value)
      valueBuffer.utils.storeAtBuffer(key)
    }

    signalError(): void {
      const buffer = this.toElrondString()
      buffer.utils.signalError()
    }

    finish(): void {
      bigIntFinishUnsigned(this.value.getHandle())
    }

    encodeTop(): ElrondString {
      return ElrondString.fromBigUint(this.value)
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      const length = bigIntUnsignedByteLength(this.value.getHandle());
      (ElrondU32.fromValue(length)).utils.encodeNested(output)
      output.write(this.toBytes())
    }

    toString(): string {
      let handle = Static.nextHandle()
      bigIntToString(this.value.getHandle(), handle)
      return ElrondString.fromHandle(handle).utils.toString()
    }

    toElrondString(): ElrondString {
      const resultHandle = Static.nextHandle()
      bigIntToString(this.value.getHandle(), resultHandle)

      return ElrondString.fromHandle(resultHandle)
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

    fromStorage(key: ElrondString): void {
      const buffer = ElrondString.dummy().utils.fromStorage(key)
      this.fromElrondString(buffer)
    }

    fromArgumentIndex(index: i32): BigUint {
      const newHandle = Static.nextHandle()
      bigIntGetUnsignedArgument(index, newHandle)

      return this.fromHandle(newHandle)
    }

    fromElrondString(buffer: ElrondString): BigUint {
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

    decodeTop(buffer: ElrondString): BigUint {
      return this.fromElrondString(buffer)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): BigUint {
      return input.readBigUint()
    }

  }

}
