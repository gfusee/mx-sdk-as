//@ts-nocheck
import {
    CommonModule,
    FEE_PENALTY_INCREASE_PERCENT,
    FeeConfig,
    FeeConfigEnum,
    MAX_ORDERS_PER_USER,
    Order,
    OrderInputParams,
    Payment, PERCENT_BASE_POINTS
} from "./common";
import {
    BigUint,
    ManagedArray,
    ManagedU32,
    ManagedU64, getContractInstance,
    getRetainedClosureValue,
    ManagedAddress, MultiValueManagedArray,
    retainClosureValue
} from "@gfusee/mx-sdk-as";
import {OrdersModule} from "./orders";

@module
export abstract class ValidationModule extends CommonModule {

    protected requireMatchProviderEmptyOrCaller(
        orders: ManagedArray<Order>
    ): void {
        const caller = this.blockchain.caller

        const ordersLength = orders.getLength()
        for (let i = ManagedU32.zero(); i < ordersLength; i++) {
            const order = orders.get(i)

            if (order.matchProvider != ManagedAddress.zero()) {
                this.require(
                    order.matchProvider == caller,
                    "Caller is not matched order id"
                )
            }
        }
    }

    protected requireContainsAll(
        vecBase: ManagedArray<ManagedU64>,
        items: ManagedArray<ManagedU64>
    ): void {
        const itemsLength = items.getLength()
        for (let i = ManagedU32.zero(); i < itemsLength; i++) {
            const item = items.get(i)
            let checkItem = false
            const vecBaseLength = vecBase.getLength()
            for (let i = ManagedU32.zero(); i < vecBaseLength; i++) {
                const base = vecBase.get(i)
                if (item == base) {
                    checkItem = true
                    break
                }
            }

            this.require(
                checkItem,
                "Base vec does not contain item"
            )
        }
    }

    protected requireContainsNone(
        vecBase: ManagedArray<ManagedU64>,
        items: ManagedArray<ManagedU64>
    ): void {
        retainClosureValue(vecBase)
        items.forEach((item) => {
            const thisRef = getContractInstance<OrdersModule>()
            const vecBaseRef = getRetainedClosureValue<ManagedArray<ManagedU64>>()
            let checkItem = false
            for (let i = ManagedU32.zero(); i < vecBaseRef.getLength(); i++) {
                const base = vecBaseRef.get(i)
                if (item == base) {
                    checkItem = true
                    break
                }
            }

            thisRef.require(
                !checkItem,
                "Base vec contains item"
            )
        })
    }

    protected requireNotMaxSize(
        addressOrderIds: ManagedArray<ManagedU64>
    ): void {
        this.require(
            addressOrderIds.getLength() < ManagedU32.fromValue(MAX_ORDERS_PER_USER),
            "Cannot place more orders"
        )
    }

    protected requireValidOrderInputParams(
        params: OrderInputParams
    ): void {
        this.requireValidOrderInputAmount(params)
        this.requireValidOrderInputMatchProvider(params)
        this.requireValidOrderInputFeeConfig(params)
        this.requireValidoOrderInputDealConfig(params)
    }

    private requireValidOrderInputAmount(
        params: OrderInputParams
    ): void {
        this.require(
            params.amount != BigUint.zero(),
            "Amount cannot be zero"
        )
        this.require(
            this.calculateFeeAmount(
                params.amount,
                FeeConfig.new(
                    FeeConfigEnum.Percent,
                    BigUint.zero(),
                    ManagedU64.fromValue(FEE_PENALTY_INCREASE_PERCENT)
                )
            ) != BigUint.zero(),
            "Penalty increase amount cannot be zero"
        )
    }

    private requireValidOrderInputMatchProvider(
        params: OrderInputParams
    ): void {
        this.require(
            params.matchProvider != ManagedAddress.zero(),
            "Match address cannot be zero"
        )
    }

    private requireValidOrderInputFeeConfig(
        params: OrderInputParams
    ): void {
        if (params.feeConfig.feeType == FeeConfigEnum.Fixed) {
            this.require(
                params.feeConfig.fixedFee < params.amount,
                "Invalid fee config fixed amount"
            )
        } else if (params.feeConfig.feeType == FeeConfigEnum.Percent) {
            this.require(
                params.feeConfig.percentFee < ManagedU64.fromValue(PERCENT_BASE_POINTS),
                "Percent value above maximum value"
            )
        }

        const amountAfterFee = this.calculateAmountAfterFee(
            params.amount,
            params.feeConfig
        )

        this.require(
            amountAfterFee != BigUint.zero(),
            "Amount after fee cannot be zero"
        )
    }

    private requireValidoOrderInputDealConfig(
        params: OrderInputParams
    ): void {
        this.require(
            params.dealConfig.matchProviderPercent < ManagedU64.fromValue(PERCENT_BASE_POINTS),
            "Bad deal config"
        )
    }

    protected requireValidBuyPayment(): Payment {
        const payment = this.callValue.singlePayment
        const secondTokenIdentifier = this.secondTokenIdentifier
        this.require(
            payment.tokenIdentifier == secondTokenIdentifier,
            "Token in and second token id should be the same"
        )

        return Payment.new(
            payment.tokenIdentifier,
            payment.amount
        )
    }

    protected requireValidSellPayment(): Payment {
        const payment = this.callValue.singlePayment
        const firstTokenIdentifier = this.firstTokenIdentifier
        this.require(
            payment.tokenIdentifier == firstTokenIdentifier,
            "Token in and first token id should be the same"
        )

        return Payment.new(
            payment.tokenIdentifier,
            payment.amount
        )
    }

    protected requireValidMatchInputOrderIds(
        orderIds: ManagedArray<ManagedU64>
    ): void {
        this.require(
            orderIds.getLength() >= ManagedU32.fromValue(2),
            "Should be at least two order ids"
        )
    }

    protected requireOrderIdsNotEmpty(
        orderIds: MultiValueManagedArray<ManagedU64>
    ): void {
        this.require(
            !orderIds.isEmpty(),
            "Order ids vec is empty"
        )
    }

}
