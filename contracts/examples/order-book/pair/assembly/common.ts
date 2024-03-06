//@ts-nocheck

import {
    BigUint,
    ManagedBuffer,
    ManagedU64,
    ManagedAddress,
    ManagedBufferNestedDecodeInput,
    TokenIdentifier
} from "@gfusee/mx-sdk-as";
import {GlobalOperationModule} from "./global-operation-helper";

export const MAX_ORDERS_PER_USER: u32 = 100;
export const PERCENT_BASE_POINTS: u64 = 100_000;
export const FEE_PENALTY_INCREASE_EPOCHS: u64 = 5;
export const FEE_PENALTY_INCREASE_PERCENT: u64 = 1_000;
export const FREE_ORDER_FROM_STORAGE_MIN_PENALTIES: u64 = 6;

@enumtype
export enum OrderType {
    Buy,
    Sell
}

@struct
export class Payment {
    tokenIdentifier!: TokenIdentifier
    amount!: BigUint

    static new(
        tokenIdentifier: TokenIdentifier,
        amount: BigUint
    ): Payment {
        const result = new Payment()
        result.tokenIdentifier = tokenIdentifier
        result.amount = amount

        return result
    }
}

@struct
export class Transfer {
    to!: ManagedAddress
    payment!: Payment

    static new(
        to: ManagedAddress,
        payment: Payment
    ): Transfer {
        const result = new Transfer()
        result.to = to
        result.payment = payment

        return result
    }
}

@enumtype
export enum FeeConfigEnum {
    Fixed,
    Percent
}

@struct
export class FeeConfig {
    feeType!: FeeConfigEnum
    fixedFee!: BigUint
    percentFee!: ManagedU64

    static new(
        feeType: FeeConfigEnum,
        fixedFee: BigUint,
        percentFee: ManagedU64
    ): FeeConfig {
        const result = new FeeConfig()
        result.feeType = feeType
        result.fixedFee = fixedFee
        result.percentFee = percentFee

        return result
    }
}

@struct
export class DealConfig {
    matchProviderPercent!: ManagedU64
}

@struct
export class OrderInputParams {
    amount!: BigUint
    matchProvider!: ManagedAddress
    feeConfig!: FeeConfig
    dealConfig!: DealConfig
}

@struct
export class Order {
    id!: ManagedU64
    creator!: ManagedAddress
    matchProvider!: ManagedAddress
    inputAmount!: BigUint
    outputAmount!: BigUint
    feeConfig!: FeeConfig
    dealConfig!: DealConfig
    createEpoch!: ManagedU64
    orderType!: OrderType

    static new(
        id: ManagedU64,
        creator: ManagedAddress,
        matchProvider: ManagedAddress,
        inputAmount: BigUint,
        outputAmount: BigUint,
        feeConfig: FeeConfig,
        dealConfig: DealConfig,
        createEpoch: ManagedU64,
        orderType: OrderType,
    ): Order {
        const result = new Order()
        result.id = id
        result.creator = creator
        result.matchProvider = matchProvider
        result.inputAmount = inputAmount
        result.outputAmount = outputAmount
        result.feeConfig = feeConfig
        result.dealConfig = dealConfig
        result.createEpoch = createEpoch
        result.orderType = orderType

        return result
    }
}

@module
export abstract class CommonModule extends GlobalOperationModule {

    firstTokenIdentifier!: TokenIdentifier
    secondTokenIdentifier!: TokenIdentifier

    protected newOrder(
        id: ManagedU64,
        payment: Payment,
        params: OrderInputParams,
        orderType: OrderType
    ): Order {
        return Order.new(
            id,
            this.blockchain.caller,
            params.matchProvider,
            payment.amount,
            params.amount,
            params.feeConfig,
            params.dealConfig,
            this.blockchain.currentBlockEpoch,
            orderType
        )
    }

    protected ruleOfThree(
        part: BigUint,
        total: BigUint,
        value: BigUint
    ): BigUint {
        return (part * value) / total
    }

    protected calculateFeeAmount(
        amount: BigUint,
        feeConfig: FeeConfig
    ): BigUint {
        if (feeConfig.feeType == FeeConfigEnum.Fixed) {
            return feeConfig.fixedFee
        } else {
            return amount * feeConfig.percentFee.toBigUint() / BigUint.fromU64(PERCENT_BASE_POINTS)
        }
    }

    protected calculateAmountAfterFee(
        amount: BigUint,
        feeConfig: FeeConfig
    ): BigUint {
        return amount - this.calculateFeeAmount(amount, feeConfig)
    }

    @view
    getFirstTokenId(): TokenIdentifier {
        return this.firstTokenIdentifier
    }

    @view
    getSecondTokenId(): TokenIdentifier {
        return this.secondTokenIdentifier
    }

}
