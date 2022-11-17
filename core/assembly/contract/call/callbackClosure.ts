//@ts-nocheck

import {ElrondString} from "../../types";
import {ManagedArgBuffer} from "../../types";
import {Mapping} from "../mapping";

const CALLBACK_CLOSURE_STORAGE_BASE_KEY: string = "CB_CLOSURE";

@struct
export class CallbackClosure {
    callbackName!: ElrondString
    closureArgs!: ManagedArgBuffer

    static new(
        callbackName: ElrondString,
        closureArgs: ManagedArgBuffer
    ): CallbackClosure {
        const result = new CallbackClosure()
        result.callbackName = callbackName
        result.closureArgs = closureArgs

        return result
    }

    static newFromCallbackName(callbackName: ElrondString): CallbackClosure {
        return CallbackClosure.new(
            callbackName,
            new ManagedArgBuffer()
        )
    }

    private static getStorageKey(): ElrondString {
        const txHash: ElrondString = __CURRENT_CONTRACT!.blockchain.txHash
        const key = ElrondString.fromString(CALLBACK_CLOSURE_STORAGE_BASE_KEY)
        key.append(txHash)

        return key
    }

    saveToStorage(): void {
        const key = CallbackClosure.getStorageKey()
        const mapping = new Mapping(key)

        mapping.set(this)
    }
}