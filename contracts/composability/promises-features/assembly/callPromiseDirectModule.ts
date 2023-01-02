//@ts-nocheck

import {
    CallbackArgumentLoader,
    CallbackClosure, CallbackResult,
    ContractBase, ContractCall, ElrondArray, ElrondEvent,
    ElrondString, ElrondU32,
    ElrondU64, ElrondVoid,
    ManagedAddress, ManagedArgBuffer, MultiValue2,
    MultiValueEncoded, TokenPayment,
} from "@gfusee/elrond-wasm-as"

class AsyncCallCallbackEvent extends ElrondEvent<MultiValue2<ElrondU32, ElrondU32>, ManagedArgBuffer> {}

@module
export abstract class CallPromiseDirectModule extends ContractBase {

    promiseRawSingleToken(
        to: ManagedAddress,
        endpointName: ElrondString,
        gasLimit: ElrondU64,
        extraGasForCallback: ElrondU64,
        args: MultiValueEncoded<ElrondString>
    ): void {
        const payment = this.callValue.singlePayment

        ContractCall.new<ElrondVoid>(to, endpointName)
            .withEgldOrSingleEsdtTransfer(payment)
            .withRawArguments(args.toArgsBuffer())
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .withExtraGasForCallback(extraGasForCallback)
            .execute(this.callbacks.theOneCallback(ElrondU32.fromValue(1001), ElrondU32.fromValue(1002)))
    }

    promiseRawMultiTransfer(
        to: ManagedAddress,
        endpointName: ElrondString,
        extraGasForCallback: ElrondU64,
        tokenPaymentArgs: MultiValueEncoded<TokenPayment>
    ): void {
        const tokenPaymentsArray = tokenPaymentArgs.toElrondArray()

        const gasLimit = (this.blockchain.getGasLeft() - extraGasForCallback) * ElrondU64.fromValue(9) / ElrondU64.fromValue(10)

        ContractCall.new<ElrondVoid>(to, endpointName)
            .withMultiEsdtTransfers(tokenPaymentsArray)
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .withExtraGasForCallback(extraGasForCallback)
            .execute(this.callbacks.theOneCallback(ElrondU32.fromValue(2001), ElrondU32.fromValue(2002)))
    }

    @callback
    theOneCallback(
        arg1: ElrondU32,
        arg2: ElrondU32,
        result: CallbackResult<MultiValueEncoded<ElrondString>>
    ): void {
        const event = new AsyncCallCallbackEvent(
            ElrondString.fromString("asyncCallCallbackEvent"),
            MultiValue2.from(
                arg1,
                arg2
            ),
            result.toArgsBuffer()
        )

        event.emit()
    }

}
