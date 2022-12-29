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
import {CallbackClosure} from "./callbackClosure"
import {AsyncCall} from "./asyncCall"

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

        return new ContractCall(
            to,
            egldPayment,
            payments,
            endpointName,
            ElrondU64.fromValue(UNSPECIFIED_GAS_LIMIT),
            argBuffer
        )
    }

    constructor(
       public to: ManagedAddress,
       public egldPayment: BigUint,
       public payments: ElrondArray<TokenPayment>,
       public endpointName: ElrondString,
       public explicitGasLimit: ElrondU64,
       public argBuffer: ManagedArgBuffer
    ) {}

    withEgldTransfer(
        egldAmount: BigUint
    ): ContractCall<T> {
        this.payments = ElrondArray.new<TokenPayment>()
        this.egldPayment = egldAmount

        return this
    }

    withEsdtTransfer(
        payment: TokenPayment
    ): ContractCall<T> {
        if (!payment.tokenIdentifier.isValidESDTIdentifier()) {
            throw new Error('token is not an esdt')
        }

        this.egldPayment = BigUint.zero()
        this.payments.push(payment)

        return this
    }

    withEgldOrSingleEsdtTransfer(
        payment: TokenPayment
    ): ContractCall<T> {
        this.payments = ElrondArray.new<TokenPayment>()
        if (payment.tokenIdentifier.isEgld()) {
            this.egldPayment = payment.amount
            this.payments = ElrondArray.new<TokenPayment>()
        } else {
            this.egldPayment = BigUint.zero()
            this.payments.push(payment)
        }

        return this
    }

    withGasLimit(
        gasLimit: ElrondU64
    ): ContractCall<T> {
        this.explicitGasLimit = gasLimit

        return this
    }

    withRawArguments(
        rawArgs: ManagedArgBuffer
    ): ContractCall<T> {
        this.argBuffer = rawArgs

        return this
    }

    pushEndpointArg<T extends BaseManagedType>(arg: T): void {
        this.argBuffer.pushArg(arg)
    }

    pushArgumentRaw(rawArg: ElrondString): void {
        this.argBuffer.pushArgRaw(rawArg)
    }

    resolveGasLimit(): ElrondU64 {
        if (this.explicitGasLimit.value == UNSPECIFIED_GAS_LIMIT) {
            const blockchainWrapper: Blockchain = __CURRENT_CONTRACT!.blockchain
            return blockchainWrapper.getGasLeft()
        } else {
            return this.explicitGasLimit
        }
    }

    call(): T {
        const converted = this.convertToEsdtTransferCall()

        const sendWrapper: SendWrapper = __CURRENT_CONTRACT!.send

        const result = sendWrapper.executeOnDestContext(
            this.resolveGasLimit(),
            converted.to,
            converted.egldPayment,
            converted.endpointName,
            converted.argBuffer
        )

        const dummy = BaseManagedType.dummy<T>()
        if (dummy.payloadSize > ElrondU32.zero()) {
            return result.get(result.getLength() - ElrondU32.fromValue(1)).utils.intoTop<T>()
        } else {
            return dummy
        }
    }

    intoAsyncCall(): AsyncCall<T> {
        return new AsyncCall<T>(
            this.convertToEsdtTransferCall(),
            ElrondU64.zero()
        )
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
                    this.explicitGasLimit,
                    newArgBuffer.concat(this.argBuffer)
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
                    this.explicitGasLimit,
                    newArgBuffer.concat(this.argBuffer)
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
            this.explicitGasLimit,
            newArgBuffer.concat(this.argBuffer)
        )
    }

}
