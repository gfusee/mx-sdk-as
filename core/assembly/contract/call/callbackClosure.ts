//@ts-nocheck

import {ManagedBuffer} from "../../types";
import {ManagedArgBuffer} from "../../types";
import {Mapping} from "../mapping";

const CALLBACK_CLOSURE_STORAGE_BASE_KEY: string = "CB_CLOSURE";

@struct
export class CallbackClosure {
    callbackName!: ManagedBuffer
    closureArgs!: ManagedArgBuffer

    static new(
        callbackName: ManagedBuffer,
        closureArgs: ManagedArgBuffer
    ): CallbackClosure {
        const result = new CallbackClosure()
        result.callbackName = callbackName
        result.closureArgs = closureArgs

        return result
    }

    static newFromCallbackName(callbackName: ManagedBuffer): CallbackClosure {
        return CallbackClosure.new(
            callbackName,
            new ManagedArgBuffer()
        )
    }

    private static getStorageKey(): ManagedBuffer {
        const txHash: ManagedBuffer = __CURRENT_CONTRACT!.blockchain.txHash
        const key = ManagedBuffer.fromString(CALLBACK_CLOSURE_STORAGE_BASE_KEY)
        key.append(txHash)

        return key
    }

    saveToStorage(): void {
        const key = CallbackClosure.getStorageKey()
        const mapping = new Mapping(key)

        mapping.set(this)
    }
}
