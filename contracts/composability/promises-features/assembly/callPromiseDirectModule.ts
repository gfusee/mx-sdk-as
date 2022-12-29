//@ts-nocheck

import {
    CallbackArgumentLoader,
    CallbackClosure, CallbackResult,
    ContractBase, ContractCall, ElrondArray, ElrondEvent,
    ElrondString, ElrondU32,
    ElrondU64, ElrondVoid,
    ManagedAddress, ManagedArgBuffer, MultiValue2,
    MultiValueEncoded,
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

        const callbackArgs = new ManagedArgBuffer()
        callbackArgs.pushArg(ElrondU32.fromValue(1001))
        callbackArgs.pushArg(ElrondU32.fromValue(1002))
        const callback = new CallbackClosure("theOneCallback", callbackArgs)

        ContractCall.new<ElrondVoid>(to, endpointName)
            .withEgldOrSingleEsdtTransfer(payment)
            .withRawArguments(args.toArgsBuffer())
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .withExtraGasForCallback(extraGasForCallback)
            .execute(callback)
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
