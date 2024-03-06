//@ts-nocheck

import {
    BigUint,
    ManagedArray,
    ManagedBuffer, ManagedU32,
    ManagedU64, ManagedAddress, ManagedBufferNestedDecodeInput,
    MultiValueManagedArray,
    MultiValueEncoded,
    TokenIdentifier
} from "@gfusee/mx-sdk-as";
import {OrdersModule} from "./orders";
import {FeeConfigEnum, OrderInputParams, OrderType} from "./common";

@contract
abstract class Pair extends OrdersModule {

    constructor(
        firstTokenIdentifier: TokenIdentifier,
        secondTokenIdentifier: TokenIdentifier
    ) {
        super();

        this.firstTokenIdentifier = firstTokenIdentifier
        this.secondTokenIdentifier = secondTokenIdentifier
    }

    createBuyOrder(
        params: OrderInputParams
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireValidOrderInputParams(params)
        const payment = this.requireValidBuyPayment()

        this.createOrderHelper(
            payment,
            params,
            OrderType.Buy
        )
    }

    createSellOrder(
        params: OrderInputParams
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireValidOrderInputParams(params)
        const payment = this.requireValidSellPayment()

        this.createOrderHelper(
            payment,
            params,
            OrderType.Sell
        )
    }

    matchOrders(
        orderIds: ManagedArray<ManagedU64>
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireValidMatchInputOrderIds(orderIds)

        this.matchOrdersHelper(orderIds)
    }

    cancelOrders(
        orderIds: MultiValueManagedArray<ManagedU64>
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireOrderIdsNotEmpty(orderIds)

        this.cancelOrdersHelper(orderIds)
    }

    cancelAllOrders(): void {
        this.requireGlobalOpNotOngoing()
        this.cancelAllOrdersHelper()
    }

    freeOrders(
        orderIds: MultiValueManagedArray<ManagedU64>
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireOrderIdsNotEmpty(orderIds)

        this.freeOrdersHelper(orderIds.asManagedArray())
    }

}
