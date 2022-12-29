//@ts-nocheck

import {
    ArrayMapping,
    BigUint,
    CallbackClosure,
    ElrondArray,
    ElrondEvent,
    ElrondString,
    ElrondU64,
    ManagedAddress,
    ManagedArgBuffer,
    MultiValue3,
    TokenIdentifier
} from "@gfusee/elrond-wasm-as"
import {VaultContract} from "./vaultContract"
import {CallbackData} from "./callbackData"
import {CallPromiseDirectModule} from "./callPromiseDirectModule"

class RetrieveFundsCallbackEvent extends ElrondEvent<MultiValue3<TokenIdentifier, ElrondU64, BigUint>, ElrondString> {}

@module
export abstract class CallPromisesModule extends CallPromiseDirectModule {

    forwardPromiseAcceptFunds(
        to: ManagedAddress
    ): void {
        const vault = new VaultContract(to)

        const payment = this.callValue.singlePayment
        const gasLimit = this.blockchain.getGasLeft() / ElrondU64.fromValue(2)

        vault
            .acceptFunds()
            .withEgldOrSingleEsdtTransfer(payment)
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .execute(null)
    }

    forwardPromiseRetrieveFunds(
        to: ManagedAddress,
        token: TokenIdentifier,
        tokenNonce: ElrondU64,
        amount: BigUint
    ): void {
        const vault = new VaultContract(to)

        const tempCallbackClosure = CallbackClosure.new(
            "retrieveFundsCallback",
            new ManagedArgBuffer()
        )

        const gasLimit = this.blockchain.getGasLeft() - ElrondU64.fromValue(20_000_000)
        vault
            .retrieveFunds(token, tokenNonce, amount)
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .withExtraGasForCallback(ElrondU64.fromValue(10_000_000))
            .execute(tempCallbackClosure)
    }

    @callback
    retrieveFundsCallback(): void {
        const payment = this.callValue.singlePayment

        const event = new RetrieveFundsCallbackEvent(
            ElrondString.fromString("retrieveFundsCallback"),
            MultiValue3.from(
                payment.tokenIdentifier,
                payment.tokenNonce,
                payment.amount
            ),
            ElrondString.new()
        )
        event.emit()

        this.callbackData().push(CallbackData.new(
            ElrondString.fromString("retrieve_funds_callback"),
            payment.tokenIdentifier,
            payment.tokenNonce,
            payment.amount,
            ElrondArray.new<ElrondString>()
        ))
    }

    abstract callbackData(): ArrayMapping<CallbackData>

}
