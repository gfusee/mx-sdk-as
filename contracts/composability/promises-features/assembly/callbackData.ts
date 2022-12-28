import {BigUint, ElrondArray, ElrondString, ElrondU64, TokenIdentifier} from "@gfusee/elrond-wasm-as"

@struct
export class CallbackData {

    callbackName!: ElrondString
    tokenIdentifier!: TokenIdentifier
    tokenNonce!: ElrondU64
    tokenAmount!: BigUint
    args!: ElrondArray<ElrondString>

    static new(
        callbackName: ElrondString,
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ElrondU64,
        tokenAmount: BigUint,
        args: ElrondArray<ElrondString>
    ): CallbackData {
        const result = new CallbackData()

        result.callbackName = callbackName
        result.tokenIdentifier = tokenIdentifier
        result.tokenNonce = tokenNonce
        result.tokenAmount = tokenAmount
        result.args = args

        return result
    }

}
