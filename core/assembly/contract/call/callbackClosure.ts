//@ts-nocheck

import {ElrondString} from "../../types";
import {ManagedArgBuffer} from "../../types";
import {Mapping} from "../mapping";

const CALLBACK_CLOSURE_STORAGE_BASE_KEY: string = "CB_CLOSURE";

export class CallbackClosure {

    constructor(
        public callbackName: string,
        public closureArgs: ManagedArgBuffer
    ) {}

    static newFromCallbackName(callbackName: ElrondString): CallbackClosure {
        return new CallbackClosure(
            callbackName,
            new ManagedArgBuffer()
        )
    }
}
