import {ElrondString} from "./erdString"
import {ManagedType} from "./interfaces/managedType"
import {ManagedUtils} from "./interfaces/managedUtils"
import {ManagedBufferNestedDecodeInput} from "./managedBufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {ElrondU32} from "./numbers";
import {ArgumentLoader} from "../utils/argumentLoader"
import {TokenIdentifier} from "./tokenIdentifier"

@final @unmanaged
export class ElrondVoid extends ManagedType {

  constructor() {
    super();
    return changetype<ElrondVoid>(0)
  }

  get handle(): i32 {
    return changetype<i32>(this)
  }

  get utils(): ElrondVoid.Utils {
    return new ElrondVoid.Utils()
  }

  get payloadSize(): ElrondU32 {
    return ElrondU32.fromValue(0)
  }

  get shouldBeInstantiatedOnHeap(): boolean {
    return false
  }

  getHandle(): i32 {
    throw new Error("No handle on ElrondVoid type")
  }

  static dummy(): ElrondVoid {
    return changetype<ElrondVoid>(0)
  }

}

export namespace ElrondVoid {

  @final @unmanaged
  export class Utils extends ManagedUtils<ElrondVoid> {

    constructor() {
      super()

      return changetype<Utils>(0)
    }

    get value(): ElrondVoid {
      return changetype<ElrondVoid>(this)
    }

    storeAtBuffer(key: ElrondString): void {
      throw new Error("Cannot be stored")
    }

    signalError(): void {
      throw new Error("Cannot be signalled as error")
    }

    finish(): void {

    }

    encodeTop(): ElrondString {
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

    fromHandle(handle: i32): ElrondVoid {
      return this.value
    }

    fromStorage(key: ElrondString): ElrondVoid {
      return this.value
    }

    fromArgument<L extends ArgumentLoader>(loader: L): ElrondVoid {
      loader.currentIndex++
      return this.value
    }

    fromElrondString(buffer: ElrondString): ElrondVoid {
      return this.value
    }

    fromBytes(bytes: Uint8Array): ElrondVoid {
      return this.value
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): ElrondVoid {
      throw new Error('Cannot use fromBytesReader')
    }

    decodeTop(buffer: ElrondString): ElrondVoid {
      return this.value
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): ElrondVoid {
      return this.value
    }

  }

}
