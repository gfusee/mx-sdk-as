//@ts-nocheck

import {BigUint, ManagedU64, ManagedAddress, TokenIdentifier} from "@gfusee/mx-sdk-as";

@struct
export class DepositInfo {
    amount!: BigUint
    depositorAddress!: ManagedAddress
    expirationRound!: ManagedU64
    tokenName!: TokenIdentifier
    nonce!: ManagedU64

    static new(
        amount: BigUint,
        depositorAddress: ManagedAddress,
        expirationRound: ManagedU64,
        tokenName: TokenIdentifier,
        nonce: ManagedU64
    ): DepositInfo {
        const result = new DepositInfo()

        result.amount = amount
        result.depositorAddress = depositorAddress
        result.expirationRound = expirationRound
        result.tokenName = tokenName
        result.nonce = nonce

        return result
    }
}
