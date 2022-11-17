//@ts-nocheck

import {
    BigUint,
    ElrondArray,
    ElrondString, ElrondU32,
    ElrondU64, ManagedAddress, ManagedBufferNestedDecodeInput,
    MultiValueElrondArray,
    MultiValueEncoded,
    TokenIdentifier
} from "@gfusee/elrond-wasm-as";
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

    testGas(orderIds: ElrondArray<ElrondString>): void {

    }

    matchOrders(
        orderIds: ElrondArray<ElrondU64>
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireValidMatchInputOrderIds(orderIds)

        this.matchOrdersHelper(orderIds)
    }

    cancelOrders(
        orderIds: MultiValueElrondArray<ElrondU64>
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
        orderIds: MultiValueElrondArray<ElrondU64>
    ): void {
        this.requireGlobalOpNotOngoing()
        this.requireOrderIdsNotEmpty(orderIds)

        this.freeOrdersHelper(orderIds.asElrondArray())
    }

}