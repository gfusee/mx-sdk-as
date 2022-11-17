//@ts-nocheck

import {BigUint, ElrondU64, ManagedAddress, TokenIdentifier} from "@gfusee/elrond-wasm-as";

@struct
export class DepositInfo {
    amount!: BigUint
    depositorAddress!: ManagedAddress
    expirationRound!: ElrondU64
    tokenName!: TokenIdentifier
    nonce!: ElrondU64

    static new(
        amount: BigUint,
        depositorAddress: ManagedAddress,
        expirationRound: ElrondU64,
        tokenName: TokenIdentifier,
        nonce: ElrondU64
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