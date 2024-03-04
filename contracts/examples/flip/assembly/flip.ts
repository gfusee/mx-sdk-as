import { ManagedU64, ManagedAddress, TokenIdentifier, BigUint } from "@gfusee/mx-sdk-as"

@struct
export class Flip {
    id!: ManagedU64
    playerAddress!: ManagedAddress
    tokenIdentifier!: TokenIdentifier
    tokenNonce!: ManagedU64
    amount!: BigUint
    bounty!: BigUint
    blockNonce!: ManagedU64
    minimumBlockBounty!: ManagedU64

    static new(
        id: ManagedU64,
        playerAddress: ManagedAddress,
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ManagedU64,
        amount: BigUint,
        bounty: BigUint,
        blockNonce: ManagedU64,
        minimumBlockBounty: ManagedU64
    ): Flip {
        const result = new Flip()

        result.id = id
        result.playerAddress = playerAddress
        result.tokenIdentifier = tokenIdentifier
        result.tokenNonce = tokenNonce
        result.amount = amount
        result.bounty = bounty
        result.blockNonce = blockNonce
        result.minimumBlockBounty = minimumBlockBounty

        return result
    }
}
