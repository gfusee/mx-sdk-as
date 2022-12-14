import { ElrondU64, ManagedAddress, TokenIdentifier, BigUint } from "@gfusee/elrond-wasm-as"

@struct
export class Flip {
    id!: ElrondU64
    playerAddress!: ManagedAddress
    tokenIdentifier!: TokenIdentifier
    tokenNonce!: ElrondU64
    amount!: BigUint
    bounty!: BigUint
    blockNonce!: ElrondU64
    minimumBlockBounty!: ElrondU64

    static new(
        id: ElrondU64,
        playerAddress: ManagedAddress,
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ElrondU64,
        amount: BigUint,
        bounty: BigUint,
        blockNonce: ElrondU64,
        minimumBlockBounty: ElrondU64
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
