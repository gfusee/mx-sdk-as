import {ElrondArray} from "./elrondArray"
import {ElrondString} from "./erdString"
import {BaseManagedType, defaultBaseManagedTypeWriteImplementation} from "./interfaces/managedType"
import {BaseManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";

class ArgBuffer {
  constructor(
      public argsBytes: Uint8Array,
      public argsLengths: Uint32Array
  ) {
  }
}

@unmanaged
export class ManagedArgBuffer extends BaseManagedType {

  private __arrayPtr: i32

  get array(): ElrondArray<ElrondString> {
    if (this.__arrayPtr == 0) {
      const array = ElrondArray.new<ElrondString>()
      this.__arrayPtr = changetype<i32>(array)

      return array
    } else {
      return changetype<ElrondArray<ElrondString>>(this.__arrayPtr)
    }
  }

  set array(value: ElrondArray<ElrondString>) {
    this.__array = value
  }

  get utils(): ManagedArgBuffer.Utils {
    return new ManagedArgBuffer.Utils(this)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return true
  }

  get payloadSize(): ElrondU32 {
    return ElrondU32.fromValue(4)
  }

  skipsReserialization(): boolean {
    return false
  }

  getHandle(): i32 {
    const buffer = ElrondString.new()
    this.array.utils.encodeWithoutLength(buffer)
    return buffer.getHandle()
  }

  getNumberOfArgs(): ElrondU32 {
    return this.array.getLength()
  }

  pushArgRaw(arg: ElrondString): void {
    this.array.push(arg)
  }

  pushArg<T extends BaseManagedType>(arg: T): void {
    this.pushArgRaw(arg.utils.encodeTop())
  }

  concat(other: ManagedArgBuffer): ManagedArgBuffer {
    this.array.appendArray(other.array)
    return this
  }

  toArgsBytes(): ArgBuffer {
    const argsBuffer = new ArgBuffer(
      new Uint8Array(0),
      new Uint32Array(0)
    )

    const thisArrayLength = this.array.getLength()
    for (let i = ElrondU32.zero(); i < thisArrayLength; i++) {
      const item = this.array.get(i)
      const itemBytes = item.utils.toBytes()

      const oldNewArgsBytesPtr = changetype<i32>(argsBuffer.argsBytes)
      const oldNewArgsLengthPtr = changetype<i32>(argsBuffer.argsLengths)

      const newArgsBytes = new Uint8Array(argsBuffer.argsBytes.length + itemBytes.length)
      newArgsBytes.set(argsBuffer.argsBytes)
      newArgsBytes.set(itemBytes, argsBuffer.argsBytes.length)

      argsBuffer.argsBytes = newArgsBytes

      const newArgsLengths = new Uint32Array(argsBuffer.argsLengths.length + 1)
      newArgsLengths.set(argsBuffer.argsLengths)
      newArgsLengths[argsBuffer.argsLengths.length] = itemBytes.byteLength

      argsBuffer.argsLengths = newArgsLengths
    }

    return argsBuffer
  }

  write(bytes: Uint8Array): void {
    defaultBaseManagedTypeWriteImplementation()
  }
}

export namespace ManagedArgBuffer {

  @final @unmanaged
  export class Utils extends BaseManagedUtils<ManagedArgBuffer> {

    constructor(
        private _value: ManagedArgBuffer
    ) {
      super();
    }

    get value(): ManagedArgBuffer {
      return this._value
    }

    finish(): void {
      this.value.array.utils.finish()
    }

    fromArgumentIndex(index: i32): ManagedArgBuffer {
      this.value.array = BaseManagedType.dummy<ElrondArray<ElrondString>>().utils.fromArgumentIndex(index)

      return this.value
    }

    fromHandle(handle: i32): ManagedArgBuffer {
      this.value.array = BaseManagedType.dummy<ElrondArray<ElrondString>>().utils.fromHandle(handle)

      return this.value
    }

    fromBytes(bytes: Uint8Array): ManagedArgBuffer {
      return BaseManagedUtils.defaultFromBytes(this, bytes)
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedArgBuffer {
      return BaseManagedUtils.defaultFromByteReader(this, retainedPtr, reader)
    }

    signalError(): void {
      this.value.array.utils.signalError()
    }

    storeAtBuffer(key: ElrondString): void {
      this.value.array.utils.storeAtBuffer(key)
    }

    toString(): string {
      return this.value.array.utils.toString()
    }

    toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
      return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
    }

    encodeTop(): ElrondString {
      return this.value.array.utils.encodeTop()
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      this.value.array.utils.encodeNested(output)
    }

    decodeTop(buffer: ElrondString): ManagedArgBuffer {
      this.value.array = BaseManagedType.dummy<ElrondArray<ElrondString>>().utils.decodeTop(buffer)

      return this.value
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): ManagedArgBuffer {
      this.value.array = BaseManagedType.dummy<ElrondArray<ElrondString>>().utils.decodeNested(input)

      return this.value
    }


  }
}
