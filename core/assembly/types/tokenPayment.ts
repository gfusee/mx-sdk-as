import { BigUint } from "./bigUint";
import { TokenIdentifier } from "./tokenIdentifier";
import {ElrondU64} from "./numbers";

@struct
export class TokenPayment {

    tokenIdentifier!: TokenIdentifier
    tokenNonce!: ElrondU64
    amount!: BigUint

    static new(
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ElrondU64,
        amount: BigUint
    ): TokenPayment {
        const result = new TokenPayment()

        result.tokenIdentifier = tokenIdentifier
        result.tokenNonce = tokenNonce
        result.amount = amount
        
        return result
    }
}