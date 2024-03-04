import {ManagedBuffer} from "./buffer"
import {defaultBaseManagedTypeWriteImplementation, ManagedType} from "./interfaces/managedType"
import {ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ManagedU32} from "./numbers";

@final @unmanaged
export class ManagedVoid extends ManagedType {

  constructor() {
    super();
    return changetype<ManagedVoid>(0)
  }

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get utils(): ManagedVoid.Utils {
    return new ManagedVoid.Utils()
  }

  get payloadSize(): ManagedU32 {
    return ManagedU32.fromValue(0)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  skipsReserialization(): boolean {
    return true
  }

  getHandle(): i32 {
    throw new Error("No handle on ManagedVoid type")
  }

  write(bytes: Uint8Array): void {
    defaultBaseManagedTypeWriteImplementation()
  }

  static dummy(): ManagedVoid {
    return changetype<ManagedVoid>(0)
  }

}

export namespace ManagedVoid {

  @final @unmanaged
  export class Utils extends ManagedUtils<ManagedVoid> {

    constructor() {
      super()

      return changetype<Utils>(0)
    }

    get value(): ManagedVoid {
      return changetype<ManagedVoid>(this)
    }

    storeAtBuffer(key: ManagedBuffer): void {
      throw new Error("Cannot be stored")
    }

    signalError(): void {
      throw new Error("Cannot be signalled as error")
    }

    finish(): void {

    }

    encodeTop(): ManagedBuffer {
      throw new Error("Cannot encode")
    }

    encodeNested<T extends NestedEncodeOutput>(output: T): void {
      throw new Error("Cannot encode")
    }

    toString(): string {
      return ""
    }

    toBytes(): Uint8Array {
      throw new Error("Cannot convert as bytes")
    }

    toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
      throw new Error("Cannot convert as bytes")
    }

    fromHandle(handle: i32): ManagedVoid {
      return this.value
    }

    fromStorage(key: ManagedBuffer): ManagedVoid {
      return this.value
    }

    fromArgumentIndex(index: i32): ManagedVoid {
      return this.value
    }

    fromManagedBuffer(buffer: ManagedBuffer): ManagedVoid {
      return this.value
    }

    fromBytes(bytes: Uint8Array): ManagedVoid {
      return this.value
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ManagedVoid {
      throw new Error('Cannot use fromBytesReader')
    }

    decodeTop(buffer: ManagedBuffer): ManagedVoid {
      return this.value
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): ManagedVoid {
      return this.value
    }

  }

}
