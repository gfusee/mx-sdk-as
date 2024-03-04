import { BigUint } from "./bigUint";
import { TokenIdentifier } from "./tokenIdentifier";
import {ManagedU64} from "./numbers";

@struct
export class TokenPayment {

    tokenIdentifier!: TokenIdentifier
    tokenNonce!: ManagedU64
    amount!: BigUint

    static new(
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ManagedU64,
        amount: BigUint
    ): TokenPayment {
        const result = new TokenPayment()

        result.tokenIdentifier = tokenIdentifier
        result.tokenNonce = tokenNonce
        result.amount = amount
        
        return result
    }
}
