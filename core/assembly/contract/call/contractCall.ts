import {
    BaseManagedType,
    BigUint,
    ElrondArray,
    ElrondString,
    ElrondU32,
    ElrondU64,
    ManagedAddress,
    TokenPayment
} from "../../types";
import {ManagedArgBuffer} from "../../types";
import {
    __frameworkGetRetainedClosureValue, __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue,
    BuiltIntFunctionNames
} from "../../utils/env";
import {Blockchain} from "../blockchain";
import {SendWrapper} from "../sendWrapper";

const UNSPECIFIED_GAS_LIMIT: u64 = u64.MAX_VALUE

export class ContractCall<T extends BaseManagedType> {

    static new<T extends BaseManagedType>(
        to: ManagedAddress,
        endpointName: ElrondString
    ): ContractCall<T> {
        const payments = ElrondArray.new<TokenPayment>()
        return ContractCall.newWithEsdtPayment<T>(to, endpointName, payments)
    }

    static newWithEsdtPayment<T extends BaseManagedType>(
        to: ManagedAddress,
        endpointName: ElrondString,
        payments: ElrondArray<TokenPayment>
    ): ContractCall<T> {
        const argBuffer = new ManagedArgBuffer()
        const egldPayment = BigUint.zero()
        const successCallback = new Uint8Array(0)
        const errorCallback = new Uint8Array(0)

        return new ContractCall(
            to,
            egldPayment,
            payments,
            endpointName,
            ElrondU64.fromValue(UNSPECIFIED_GAS_LIMIT),
            ElrondU64.fromValue(UNSPECIFIED_GAS_LIMIT),
            argBuffer,
            successCallback,
            errorCallback
        )
    }

    constructor(
       public to: ManagedAddress,
       public egldPayment: BigUint,
       public payments: ElrondArray<TokenPayment>,
       public endpointName: ElrondString,
       public extraGasForCallback: ElrondU64,
       public explicitGasLimit: ElrondU64,
       public argBuffer: ManagedArgBuffer,
       public successCallback: Uint8Array,
       public errorCallback: Uint8Array
    ) {}

    withEgldTransfer(
        egldAmount: BigUint
    ): ContractCall {
        this.payments = ElrondArray.new<TokenPayment>()
        this.egldPayment = egldAmount

        return this
    }

    pushEndpointArg<T extends BaseManagedType>(arg: T): void {
        this.argBuffer.pushArg(arg)
    }

    pushArgumentRaw(rawArg: ElrondString): void {
        this.argBuffer.pushArgRaw(rawArg)
    }

    call(): T {
        const blockchainWrapper: Blockchain = __CURRENT_CONTRACT!.blockchain
        const sendWrapper: SendWrapper = __CURRENT_CONTRACT!.send

        const result = sendWrapper.executeOnDestContext(
            blockchainWrapper.getGasLeft(),
            this.to,
            this.egldPayment,
            this.endpointName,
            this.argBuffer
        )

        const dummy = BaseManagedType.dummy<T>()
        if (dummy.payloadSize > ElrondU32.zero()) {
            return result.get(result.getLength() - ElrondU32.fromValue(1)).utils.intoTop<T>()
        } else {
            return dummy
        }
    }

    private convertToEsdtTransferCall(): ContractCall<T> {
        const paymentsLength = this.payments.getLength()

        if (paymentsLength == ElrondU32.zero()) {
            return this
        } else if (paymentsLength == ElrondU32.fromValue(1)) {
            return this.convertSingleTransferEsdtCall()
        } else {
            return this.convertToMultiTransferEsdtCall()
        }
    }

    private convertSingleTransferEsdtCall(): ContractCall<T> {
        const optFirstPayment = this.payments.tryGet(ElrondU32.fromValue(0))
        if (!optFirstPayment.isNull()) {
            const payment = optFirstPayment.unwrap()

            if (payment.tokenNonce == ElrondU64.zero()) {
                const noPayments = new ElrondArray<TokenPayment>()

                //fungible ESDT
                const newArgBuffer = new ManagedArgBuffer()
                newArgBuffer.pushArg(payment.tokenIdentifier)
                newArgBuffer.pushArg(payment.amount)
                if (!this.endpointName.isEmpty()) {
                    newArgBuffer.pushArg(this.endpointName)
                }

                const zero = BigUint.zero()
                const endpointName = ElrondString.fromString(BuiltIntFunctionNames.ESDT_TRANSFER_FUNC_NAME)

                return new ContractCall(
                    this.to,
                    zero,
                    noPayments,
                    endpointName,
                    this.extraGasForCallback,
                    this.explicitGasLimit,
                    newArgBuffer.concat(this.argBuffer),
                    this.successCallback,
                    this.errorCallback
                )
            } else {
                const payments = new ElrondArray<TokenPayment>()

                const newArgBuffer = new ManagedArgBuffer()
                newArgBuffer.pushArg(payment.tokenIdentifier)
                newArgBuffer.pushArg(payment.tokenNonce)
                newArgBuffer.pushArg(payment.amount)
                newArgBuffer.pushArg(this.to)
                if (!this.endpointName.isEmpty()) {
                    newArgBuffer.pushArg(this.endpointName)
                }

                const recipientAddress = __CURRENT_CONTRACT!.blockchain.scAddress
                const zero = BigUint.zero()
                const endpointName = ElrondString.fromString(BuiltIntFunctionNames.ESDT_NFT_TRANSFER_FUNC_NAME)

                return new ContractCall(
                    recipientAddress,
                    zero,
                    payments,
                    endpointName,
                    this.extraGasForCallback,
                    this.explicitGasLimit,
                    newArgBuffer.concat(this.argBuffer),
                    this.successCallback,
                    this.errorCallback
                )
            }
        } else {
            return this
        }
    }

    private convertToMultiTransferEsdtCall(): ContractCall<T> {
        const payments = ElrondArray.new<TokenPayment>()

        const newArgBuffer = new ManagedArgBuffer()
        newArgBuffer.pushArg(this.to)
        newArgBuffer.pushArg(this.payments.getLength())

        __frameworkRetainClosureValue(newArgBuffer)
        this.payments.forEach((payment) => {
            const newArgBufferRef = __frameworkGetRetainedClosureValue<ManagedArgBuffer>()
            newArgBufferRef.pushArg(payment.tokenIdentifier)
            newArgBufferRef.pushArg(payment.tokenNonce)
            newArgBufferRef.pushArg(payment.amount)
            __frameworkRetainClosureValue(newArgBufferRef)
        })
        __frameworkReleaseRetainedClosureValue()

        if (!this.endpointName.isEmpty()) {
            newArgBuffer.pushArg(this.endpointName)
        }

        const recipientAddress = __CURRENT_CONTRACT!.blockchain.scAddress
        const zero = BigUint.zero()
        const endpointName = ElrondString.fromString(BuiltIntFunctionNames.ESDT_MULTI_TRANSFER_FUNC_NAME)

        return new ContractCall(
            recipientAddress,
            zero,
            payments,
            endpointName,
            this.extraGasForCallback,
            this.explicitGasLimit,
            newArgBuffer.concat(this.argBuffer),
            this.successCallback,
            this.errorCallback
        )
    }

}