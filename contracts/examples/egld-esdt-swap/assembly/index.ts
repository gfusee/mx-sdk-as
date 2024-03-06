//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ManagedEvent,
    ManagedBuffer, ManagedU32,
    ManagedAddress,
    Mapping,
    MultiValue2,
    TokenIdentifier,
    FungibleTokenProperties, ManagedU64,
    ManagedBoolean
} from "@gfusee/mx-sdk-as";

const EGLD_NUMBER_OF_DECIMALS: u32 = 18;

class IssueStartedEvent extends ManagedEvent<MultiValue2<ManagedAddress, ManagedBuffer>, BigUint> {}

@contract
abstract class EgldEsdtSwap extends ContractBase {

    // TODO : implement mx-sdk-rs modules or something similar
    paused!: ManagedBoolean

    isPaused(): ManagedBoolean {
        return this.paused
    }

    wrapEgld(): void {
        this.require(
            !this.isPaused().value,
            "contract is paused"
        )

        const paymentAmount = this.callValue.egldValue
        this.require(
            paymentAmount > BigUint.zero(),
            "Payment must be more than 0"
        )

        const wrappedEgldTokenId = this.wrappedEgldTokenId().get()
        this.send.esdtLocalMint(
            wrappedEgldTokenId,
            ManagedU64.zero(),
            paymentAmount
        )

        const caller = this.blockchain.caller
        this.send.direct(
            caller,
            wrappedEgldTokenId,
            ManagedU64.zero(),
            paymentAmount
        )
    }

    unwrapEgld(): void {
        this.require(
            !this.isPaused().value,
            "contract is paused"
        )

        const payment = this.callValue.singleEsdtPayment
        const wrappedEgldTokenId = this.wrappedEgldTokenId().get()

        this.require(
            payment.tokenIdentifier == wrappedEgldTokenId,
            "Wrong esdt token"
        )

        this.require(
            payment.amount <= this.getLockedEgldBalance(),
            "Contract does not have enough funds"
        )

        this.send
            .esdtLocalBurn(
                wrappedEgldTokenId,
                ManagedU64.zero(),
                payment.amount
            )

        const caller = this.blockchain.caller
        this.send.directEgld(
            caller,
            payment.amount
        )
    }

    getLockedEgldBalance(): BigUint {
        return this.blockchain.getSCBalance(
            TokenIdentifier.egld(),
            ManagedU64.zero()
        )
    }

    abstract wrappedEgldTokenId(): Mapping<TokenIdentifier>

}
