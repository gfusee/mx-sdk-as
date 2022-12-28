//@ts-nocheck

import {ElrondString} from "../../types";
import {ManagedArgBuffer} from "../../types";
import {Mapping} from "../mapping";

const CALLBACK_CLOSURE_STORAGE_BASE_KEY: string = "CB_CLOSURE";

@struct
export class CallbackClosure {
    callbackName!: string
    closureArgs!: ManagedArgBuffer

    static new(
        callbackName: string,
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
}
