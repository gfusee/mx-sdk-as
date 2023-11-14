//@ts-nocheck

import {
    BigUint, ContractBase,
    ElrondArray, ElrondU32,
    ElrondU64, ManagedAddress, MapMapping,
    Mapping,
    MultiValue2, MultiValueEncoded, OptionalValue,
    TokenIdentifier,
    TokenPayment
} from "@gfusee/elrond-wasm-as"
import {
    getRetainedClosureValue,
    releaseRetainedClosureValue,
    retainClosureValue
} from "@gfusee/elrond-wasm-as"
import {AbstractFee, FeeExactValue, FeePercentage, FeeType, FeeUnset, PERCENTAGE_DIVISOR} from "./fee"

@contract
abstract class EsdtTransferWithFee extends ContractBase {

    @onlyOwner
    setExactValueFee(
        feeToken: TokenIdentifier,
        feeAmount: BigUint,
        token: TokenIdentifier
    ): void {
        this.storeTokenFee(
            token,
            FeeType.ExactValue,
            OptionalValue.withValue(
                TokenPayment.new(
                    feeToken,
                    ElrondU64.zero(),
                    feeAmount
                )
            ),
            OptionalValue.null<ElrondU32>()
        )
    }

    @onlyOwner
    setPercentageFee(
        fee: ElrondU32,
        token: TokenIdentifier
    ): void {
        this.storeTokenFee(
            token,
            FeeType.Percentage,
            OptionalValue.null<TokenPayment>(),
            OptionalValue.withValue(
                fee
            )
        )
    }

    @onlyOwner
    claimFees(): void {
        const paidFees = this.paidFees();

        this.require(
            !paidFees.isEmpty(),
            "There is nothing to claim"
        )

        const fees = new ElrondArray<TokenPayment>()
        retainClosureValue(fees)
        paidFees.forEach((key, item) => {
            const feesRef = getRetainedClosureValue<ElrondArray<TokenPayment>>()
            feesRef.push(
                TokenPayment.new(
                    key.a,
                    key.b,
                    item
                )
            )
            retainClosureValue(feesRef)
        })
        releaseRetainedClosureValue()

        this.paidFees().clear()

        const caller = this.blockchain.caller

        this.send.directMulti(caller, fees)
    }

    transfer(
        address: ManagedAddress
    ): void {
        this.require(
            this.callValue.egldValue == BigUint.zero(),
            "EGLD transfers not allowed"
        )

        const payments = this.callValue.allEsdtPayments
        let newPayments = new ElrondArray<TokenPayment>()

        let i = ElrondU32.zero()
        const paymentLength = payments.getLength()
        while (i < paymentLength) {
            const payment = payments.get(i)
            const fee = this.tokenFee(payment.tokenIdentifier).get()

            if (fee.type == FeeType.ExactValue) {
                const fees = fee.intoExactValue().exactValue
                i++
                if (i >= paymentLength) {
                    this.panic("Fee payment missing")
                }
                const nextPayment = payments.get(i)
                this.require(
                    nextPayment.tokenIdentifier == fees.tokenIdentifier &&
                    nextPayment.tokenNonce == nextPayment.tokenNonce,
                    "Fee payment missing"
                )

                this.require(
                    nextPayment.amount == fees.amount,
                    "Mismatching payment for covering fees"
                )

                this.getPaymentAfterFees(fees, nextPayment)
                newPayments.push(payment)
            } else if (fee.type == FeeType.Percentage) {
                const feePercentage = fee.intoPercentage().percentage
                const fees = this.calculateFeePecentage(feePercentage, payment)
                newPayments.push(this.getPaymentAfterFees(fees, payment))
            } else {
                newPayments.push(payment)
            }

            i++
        }

        this.send.directMulti(address, newPayments)
    }

    @view
    getPaidFees(): MultiValueEncoded<MultiValue2<MultiValue2<TokenIdentifier, ElrondU64>, BigUint>> {
        const result = new MultiValueEncoded<MultiValue2<MultiValue2<TokenIdentifier, ElrondU64>, BigUint>>()

        const paidFeeIterator = this.paidFees().getIterator()

        let current = paidFeeIterator.next()
        while (!current.isNull()) {
            result.push(current.unwrap())

            current = paidFeeIterator.next()
        }

        return result
    }

    private getPaymentAfterFees(
        feePayment: TokenPayment,
        payment: TokenPayment
    ): TokenPayment {
        const newPayment = payment;

        retainClosureValue(feePayment.amount)
        this.paidFees()
            .entry(
                MultiValue2.from(
                    newPayment.tokenIdentifier,
                    newPayment.tokenNonce
                )
            )
            .orInsert(BigUint.zero())
            .update((value) => {
                const feeAmount = getRetainedClosureValue<BigUint>()
                return value + feeAmount
            })

        newPayment.amount -= feePayment.amount

        return newPayment
    }

    private calculateFeePecentage(
        percentage: ElrondU32,
        providedPayment: TokenPayment
    ): TokenPayment {
        const calculatedFeeAmount = providedPayment.amount * BigUint.fromU64(percentage.value as u64) / BigUint.fromU64(PERCENTAGE_DIVISOR as u64) //TODO : no .value

        return TokenPayment.new(
            providedPayment.tokenIdentifier,
            providedPayment.tokenNonce,
            calculatedFeeAmount
        )
    }

    //No enum with values in typescript, so we need to store manually values
    private storeTokenFee(
        token: TokenIdentifier,
        type: FeeType,
        exactValue: OptionalValue<TokenPayment>,
        percentage: OptionalValue<ElrondU32>
    ): void {
        if (type == FeeType.Unset) {
            FeeUnset.new().utils.storeAtBuffer(this.tokenFee(token).key.buffer)
        } else if (type == FeeType.ExactValue) {
            if (exactValue.isNull()) {
                this.panic("no exact value to store")
            }

            FeeExactValue.from(exactValue.value!).utils.storeAtBuffer(this.tokenFee(token).key.buffer)
        } else if (type == FeeType.Percentage) {
            if (percentage.isNull()) {
                this.panic("no percentage to store")
            }

            FeePercentage.from(percentage.value!).utils.storeAtBuffer(this.tokenFee(token).key.buffer)
        }

    }

    abstract tokenFee(token: TokenIdentifier): Mapping<AbstractFee>

    abstract paidFees(): MapMapping<MultiValue2<TokenIdentifier, ElrondU64>, BigUint>

}
