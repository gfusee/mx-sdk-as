//@ts-nocheck

import {
    CallbackClosure,
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
        callbackArgs.pushArg(ElrondU32.fromValue(2001))
        callbackArgs.pushArg(ElrondU32.fromValue(2002))
        const callback = CallbackClosure.new("theOneCallback", callbackArgs)

        ContractCall.new<ElrondVoid>(to, endpointName)
            .withEgldOrSingleEsdtTransfer(payment)
            .withRawArguments(args.toArgsBuffer())
            .withGasLimit(gasLimit)
            .intoAsyncCall()
            .withExtraGasForCallback(extraGasForCallback)
            .execute(callback)
    }

    @callback
    theOneCallback(): void {

        const resultRaw = this.send.getCallbackClosure()
        const argsRaw = ElrondArray.new<ElrondString>().utils.decodeTop(resultRaw)
        argsRaw.get(ElrondU32.fromValue(1)).utils.intoTop<ElrondU32>().utils.signalError()

        /*
        const event = new AsyncCallCallbackEvent(
            ElrondString.fromString("asyncCallCallbackEvent"),
            MultiValue2.from(
                arg1,
                arg2
            ),
            new ManagedArgBuffer()
        )

        event.emit()
         */
    }

}
