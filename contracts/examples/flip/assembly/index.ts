//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ManagedU8,
    ManagedU64,
    Mapping,
    TokenIdentifier,
    RandomnessSource, ManagedAddress
} from "@gfusee/mx-sdk-as";

import {Flip} from "./flip";

const HUNDRED_PERCENT: u64 = 10_000

@contract
abstract class FlipContract extends ContractBase {

    constructor(
        ownerPercentFees: ManagedU64,
        bountyPercentFees: ManagedU64,
        minimumBlockBounty: ManagedU64
    ) {
        super()
        this.ownerPercentFees().set(ownerPercentFees)
        this.bountyPercentFees().set(bountyPercentFees)

        this.require(
            minimumBlockBounty > ManagedU64.zero(),
            "minimumBlockBounty is zero"
        )

        this.minimumBlockBounty().set(minimumBlockBounty)
    }

    flip(): void {
        const payment = this.callValue.singlePayment

        const tokenReserve = this.tokenReserve(
            payment.tokenIdentifier,
            payment.tokenNonce
        ).get()

        this.require(
            tokenReserve > BigUint.zero(),
            "no token reserve"
        )

        this.require(
            !this.maximumBet(payment.tokenIdentifier, payment.tokenNonce).isEmpty(),
            "no maximum bet"
        )

        this.require(
            !this.maximumBetPercent(payment.tokenIdentifier, payment.tokenNonce).isEmpty(),
            "no maximum bet percent"
        )

        const maximumBet = this.maximumBet(
            payment.tokenIdentifier,
            payment.tokenNonce
        ).get()

        const maximumBetPercent = this.maximumBetPercent(
            payment.tokenIdentifier,
            payment.tokenNonce
        ).get()

        const maximumBetPercentComputed = tokenReserve * maximumBetPercent.toBigUint() / BigUint.fromU64(HUNDRED_PERCENT)

        const maximumAllowedBet = maximumBet < maximumBetPercentComputed ? maximumBet : maximumBetPercentComputed

        const ownerProfits = payment.amount * this.ownerPercentFees().get().toBigUint() / BigUint.fromU64(HUNDRED_PERCENT)
        const bounty = payment.amount * this.bountyPercentFees().get().toBigUint() / BigUint.fromU64(HUNDRED_PERCENT)
        const amount = payment.amount - bounty - ownerProfits

        this.require(
            amount <= maximumAllowedBet,
            "too much bet"
        )

        const lastFlipId = this.lastFlipId().isEmpty() ? ManagedU64.zero() : this.lastFlipId().get()

        const flipId = lastFlipId + ManagedU64.fromValue(1)

        const flip = Flip.new(
            flipId,
            this.blockchain.caller,
            payment.tokenIdentifier,
            payment.tokenNonce,
            amount,
            bounty,
            this.blockchain.currentBlockNonce,
            this.minimumBlockBounty().get()
        )

        this.tokenReserve(
            payment.tokenIdentifier,
            payment.tokenNonce
        ).set(tokenReserve - amount)

        this.send
            .direct(
                this.blockchain.owner,
                payment.tokenIdentifier,
                payment.tokenNonce,
                ownerProfits
            )

        this.flipForId(flipId).set(flip)
        this.lastFlipId().set(flipId)
    }

    private makeFlip(
        bountyAddress: ManagedAddress,
        flip: Flip
    ): void {
        const randomNumber = RandomnessSource.nextU8InRange(ManagedU8.fromValue(0), ManagedU8.fromValue(2))
        const isWin = randomNumber == ManagedU8.fromValue(1)

        this.send
            .direct(
                bountyAddress,
                flip.tokenIdentifier,
                flip.tokenNonce,
                flip.bounty
            )

        const profitIfWin = flip.amount * BigUint.fromU64(2)

        if (isWin) {
            this.send
                .direct(
                    flip.playerAddress,
                    flip.tokenIdentifier,
                    flip.tokenNonce,
                    profitIfWin
                )
        } else {
            let oldTokenReserve = this.tokenReserve(
                flip.tokenIdentifier,
                flip.tokenNonce
            ).get()

            this.tokenReserve(
                flip.tokenIdentifier,
                flip.tokenNonce
            ).set(oldTokenReserve + profitIfWin)
        }

        this.flipForId(flip.id).clear()
    }

    bounty(): void {
        const caller = this.blockchain.caller

        this.require(
            !this.blockchain.isSmartContract(caller),
            "caller is a smart contract"
        )

        const lastBountyFlipId = this.lastBountyFlipId().get()
        const lastFlipId = this.lastFlipId().get()

        this.require(
            lastBountyFlipId < lastFlipId,
            "last bounty flip id >= last flip id"
        )

        const currentBlockNonce = this.blockchain.currentBlockNonce

        let bountyFlipId = lastBountyFlipId

        while (bountyFlipId < lastFlipId) {
            const flipId = bountyFlipId + ManagedU64.fromValue(1)

            if (this.flipForId(flipId).isEmpty()) {
                break
            }

            const flip = this.flipForId(flipId).get()

            if (currentBlockNonce < flip.blockNonce + flip.minimumBlockBounty) {
                break
            }

            this.makeFlip(
                caller,
                flip
            )

            bountyFlipId = bountyFlipId + ManagedU64.fromValue(1)
        }

        this.require(
            bountyFlipId != lastBountyFlipId,
            "no bounty"
        )

        this.lastBountyFlipId().set(bountyFlipId)
    }

    @onlyOwner
    increaseReserve(): void {
        const payment = this.callValue.singlePayment

        this.require(
            payment.amount > BigUint.zero(),
            "no payment"
        )

        const oldTokenReserve = this.tokenReserve(payment.tokenIdentifier, payment.tokenNonce).get()

        this.tokenReserve(payment.tokenIdentifier, payment.tokenNonce).set(oldTokenReserve + payment.amount)
    }

    @onlyOwner
    withdrawReserve(
        tokenIdentifier: TokenIdentifier,
        nonce: ManagedU64,
        amount: BigUint
    ): void {
        const owner = this.blockchain.caller

        const tokenReserve = this.tokenReserve(tokenIdentifier, nonce).get()

        this.require(
            tokenReserve <= amount,
            "amount too high"
        )

        this.tokenReserve(tokenIdentifier, nonce).set(tokenReserve - amount)

        this.send.direct(
            owner,
            tokenIdentifier,
            nonce,
            amount
        )
    }

    @onlyOwner
    setMaximumBet(
        tokenIdentifier: TokenIdentifier,
        nonce: ManagedU64,
        amount: BigUint
    ): void {
        this.require(
            amount > BigUint.zero(),
            "amount zero"
        )

        this.maximumBet(tokenIdentifier, nonce).set(amount)
    }

    @onlyOwner
    setMaximumBetPercent(
        tokenIdentifier: TokenIdentifier,
        nonce: ManagedU64,
        percent: ManagedU64
    ): void {
        this.require(
            percent > ManagedU64.zero(),
            "percent zero"
        )

        this.maximumBetPercent(tokenIdentifier, nonce).set(percent)
    }

    @onlyOwner
    setMinimumBlockBounty(
        minimumBlockBounty: ManagedU64
    ): void {
        this.require(
            minimumBlockBounty > ManagedU64.zero(),
            "minimum block bounty zero"
        )

        this.minimumBlockBounty().set(minimumBlockBounty)
    }

    abstract ownerPercentFees(): Mapping<ManagedU64>

    abstract bountyPercentFees(): Mapping<ManagedU64>

    abstract maximumBet(
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ManagedU64
    ): Mapping<BigUint>

    abstract maximumBetPercent(
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ManagedU64
    ): Mapping<ManagedU64>

    abstract minimumBlockBounty(): Mapping<ManagedU64>

    abstract tokenReserve(
        tokenIdentifier: TokenIdentifier,
        tokenNonce: ManagedU64
    ): Mapping<BigUint>

    abstract flipForId(id: ManagedU64): Mapping<Flip>

    abstract lastFlipId(): Mapping<ManagedU64>

    abstract lastBountyFlipId(): Mapping<ManagedU64>

}
