import {BaseManagedType, ElrondString, ElrondU32, ElrondU64, ManagedAddress} from "../../types"
import {CallbackClosure} from "./callbackClosure"
import {SendWrapper} from "../sendWrapper"
import {ContractCall} from "./contractCall"

export class AsyncCall<T extends BaseManagedType> {

    constructor(
        private contractCall: ContractCall<T>,
        public extraGasForCallback: ElrondU64,
    ) {}

    withExtraGasForCallback(
        extraGasForCallback: ElrondU64
    ): AsyncCall<T> {
        this.extraGasForCallback = extraGasForCallback

        return this
    }

    execute(callback: CallbackClosure | null): void {
        const sendWrapper: SendWrapper = __CURRENT_CONTRACT!.send

        const cbClosureArgsSerialized = callback != null ? callback.closureArgs.utils.encodeTop() : ElrondString.new()
        const cbName = callback != null ? callback.callbackName : ""

        sendWrapper.asyncCallRaw(
            this.contractCall.to,
            this.contractCall.egldPayment,
            this.contractCall.endpointName,
            this.contractCall.argBuffer,
            cbName,
            cbName,
            this.contractCall.explicitGasLimit,
            this.extraGasForCallback,
            cbClosureArgsSerialized
        )
    }

}
