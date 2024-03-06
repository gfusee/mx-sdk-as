import {checkIfDebugBreakpointEnabled, enableSecondDebugBreakpoint, validateTokenIdentifier} from "../utils/env"
import { ManagedBuffer } from "./buffer"
import { ManagedWrappedString } from "./managedWrappedString"
import {ManagedBufferNestedDecodeInput} from "./bufferNestedDecodeInput";
import {NestedEncodeOutput} from "./interfaces/nestedEncodeOutput";
import {BaseManagedUtils, ManagedUtils} from "./interfaces/managedUtils";
import {defaultBaseManagedTypeWriteImplementation} from "./interfaces/managedType"

@unmanaged
export class TokenIdentifier extends ManagedWrappedString {

  get utils(): TokenIdentifier.Utils {
    return TokenIdentifier.Utils.fromValue(this)
  }

  private static egldRepresentation(): ManagedBuffer {
    return ManagedBuffer.fromString('EGLD')
  }

  skipsReserialization(): boolean {
    return false
  }

  isValid(): bool {
    return this.isEgld() || this.isEsdt()
  }

  isEgld(): bool {
    return this.buffer == TokenIdentifier.egldRepresentation()
  }

  isEsdt(): bool {
    return validateTokenIdentifier(this.buffer.getHandle()) != 0
  }

  write(bytes: Uint8Array): void {
    defaultBaseManagedTypeWriteImplementation()
  }

  static fromString(str: string): TokenIdentifier {
    return TokenIdentifier.fromBuffer(ManagedBuffer.fromString(str))
  }

  static fromBuffer(buffer: ManagedBuffer): TokenIdentifier {
    return TokenIdentifier.dummy().utils.fromBuffer(buffer)
  }

  static dummy(): TokenIdentifier {
    return changetype<TokenIdentifier>(0)
  }

  static egld(): TokenIdentifier {
    return TokenIdentifier.fromBuffer(TokenIdentifier.egldRepresentation())
  }

  static MAX_POSSIBLE_TOKEN_IDENTIFIER_LENGTH: i32 = 32
}

export namespace TokenIdentifier {

  @final @unmanaged
  export class Utils extends ManagedUtils<TokenIdentifier> {

    static fromValue(value: TokenIdentifier): Utils {
      return changetype<Utils>(value.getHandle())
    }

    get value(): TokenIdentifier {
      return changetype<TokenIdentifier>(this)
    }

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

    toByteWriter<R>(retainedPtr: i32[], writer: (retainedPtr: i32[], bytes: Uint8Array) => R): R {
      return BaseManagedUtils.defaultToByteWriter<Utils, R>(this, retainedPtr, writer)
    }

    toString(): string {
      return this.value.buffer.utils.toString()
    }

    fromBuffer(buffer: ManagedBuffer): TokenIdentifier {
      return changetype<TokenIdentifier>(buffer)
    }

    fromString(str: string): void {
      this.value.buffer = ManagedBuffer.fromString(str)
    }

    fromHandle(handle: i32): TokenIdentifier {
      return changetype<TokenIdentifier>(handle)
    }

    fromArgumentIndex(argIndex: i32): TokenIdentifier {
      const buffer = ManagedBuffer.dummy().utils.fromArgumentIndex(argIndex)
      return this.fromBuffer(buffer)
    }

    fromStorage(key: ManagedBuffer): TokenIdentifier {
      return this.fromBuffer(ManagedBuffer.dummy().utils.fromStorage(key))
    }

    fromBytes(bytes: Uint8Array): TokenIdentifier {
      return this.fromBuffer(ManagedBuffer.dummy().utils.fromBytes(bytes))
    }

    fromByteReader(retainedPtr: i32[], reader: (retainedPtr: i32[], bytes: Uint8Array) => void): TokenIdentifier {
      return BaseManagedUtils.defaultFromByteReader<TokenIdentifier, Utils>(this, retainedPtr, reader);
    }

    decodeTop(buffer: ManagedBuffer): TokenIdentifier {
      return this.fromBuffer(buffer)
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): TokenIdentifier {
      return changetype<TokenIdentifier>(input.readManagedBuffer())
    }

  }
}
