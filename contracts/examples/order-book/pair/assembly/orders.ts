//@ts-nocheck
import {
    BigUint, ManagedArray,
    ManagedEvent,
    ManagedBuffer,
    ManagedU32,
    ManagedU64, getContractInstance,
    getRetainedClosureValue,
    ManagedAddress,
    Mapping,
    MultiValue2,
    MultiValue3,
    MultiValue4,
    MultiValue5,
    MultiValueManagedArray,
    releaseRetainedClosureValue,
    retainClosureValue,
    TokenIdentifier
} from "@gfusee/mx-sdk-as";
import {
    DealConfig,
    FEE_PENALTY_INCREASE_EPOCHS,
    FEE_PENALTY_INCREASE_PERCENT,
    FeeConfig,
    FeeConfigEnum,
    FREE_ORDER_FROM_STORAGE_MIN_PENALTIES,
    Order,
    OrderInputParams,
    OrderType,
    Payment,
    PERCENT_BASE_POINTS,
    Transfer
} from "./common";
import {ValidationModule} from "./validation";

class OrderEvent extends ManagedEvent<MultiValue3<ManagedAddress, ManagedU64, OrderType>, Order> {}
class CancelOrderEvent extends ManagedEvent<MultiValue4<ManagedAddress, ManagedU64, OrderType, ManagedU64>, ManagedBuffer> {}
class FreeOrderEvent extends ManagedEvent<MultiValue5<ManagedAddress, ManagedU64, OrderType, ManagedU64, ManagedAddress>, ManagedBuffer> {}
class MatchOrderEvent extends ManagedEvent<MultiValue5<ManagedAddress, ManagedU64, OrderType, ManagedU64, ManagedAddress>, ManagedBuffer> {}

@module
export abstract class OrdersModule extends ValidationModule {

    protected getAndIncreaseOrderIdCounter(): ManagedU64 {
        const id = this.orderIdCounter().get()
        this.orderIdCounter().set(id + ManagedU64.fromValue(1))

        return id
    }

    @view
    getOrderIdCounter(): ManagedU64 {
        return this.orderIdCounter().get()
    }

    @view
    getOrderById(
        id: ManagedU64
    ): Order {
        return this.orders(id).get()
    }

    @view
    getAddressOrderIds(
        address: ManagedAddress
    ): MultiValueManagedArray<ManagedU64> {
        const ordersArray = new MultiValueManagedArray<ManagedU64>()

        const addressOrderIds = this.addressOrderIds(address).get()
        const addressOrderIdsLength = addressOrderIds.getLength()

        for (let i = ManagedU32.zero(); i < addressOrderIdsLength; i++) {
            const order = addressOrderIds.get(i)

            if (!this.orders(order).isEmpty()) {
                ordersArray.push(order)
            }
        }

        return ordersArray
    }

    protected createOrderHelper(
        payment: Payment,
        params: OrderInputParams,
        orderType: OrderType
    ): void {
        const caller = this.blockchain.caller
        const addressOrderIds = this.getAddressOrderIds(caller)
        this.requireNotMaxSize(addressOrderIds.asManagedArray())

        const newOrderId = this.getAndIncreaseOrderIdCounter()
        const order = this.newOrder(
            newOrderId,
            payment,
            params,
            orderType
        )
        this.orders(order.id).set(order)

        const addressOrders = new ManagedArray<ManagedU64>()
        addressOrders.push(order.id)
        this.addressOrderIds(caller).set(addressOrders)


        this.emitOrderEvent(order)
    }

    protected matchOrdersHelper(
        ordersIds: ManagedArray<ManagedU64>
    ): void {
        const orders = this.loadOrders(ordersIds)
        this.require(
            orders.getLength() == ordersIds.getLength(),
            "Order vectors len mismatch"
        )
        this.requireMatchProviderEmptyOrCaller(orders)
        const transfers = this.createTransfers(orders)
        this.clearOrders(ordersIds)
        this.executeTransfers(transfers)

        this.emitMatchOrderEvents(orders)
    }

    protected cancelOrdersHelper(
        orderIds: MultiValueManagedArray<ManagedU64>
    ): void {
        const caller = this.blockchain.caller

        const addressOrderIds = this.getAddressOrderIds(caller)
        this.requireContainsAll(addressOrderIds.asManagedArray(), orderIds.asManagedArray())

        const firstTokenIdentifier = this.firstTokenIdentifier
        const secondTokenIdentifier = this.secondTokenIdentifier
        const epoch = this.blockchain.currentBlockEpoch

        const orderIdsNotEmpty = new MultiValueManagedArray<ManagedU64>()

        for (let i = ManagedU32.zero(); i < orderIds.getLength(); i++) {
            const order = orderIds.get(i)
            if (!this.orders(order).isEmpty()) {
                orderIdsNotEmpty.push(order)
            }
        }

        const orders = new ManagedArray<Order>()
        const finalCallerOrders = new ManagedArray<ManagedU64>()

        for (let i = ManagedU32.zero(); i < orderIdsNotEmpty.getLength(); i++) {
            const orderId = orderIdsNotEmpty.get(i)
            const order = this.cancelOrder(
                orderId,
                caller,
                firstTokenIdentifier,
                secondTokenIdentifier,
                epoch
            )

            let checkOrderToDelete = false
            for (let i = ManagedU32.zero(); i < addressOrderIds.getLength(); i++) {
                const checkOrder = addressOrderIds.get(i)
                if (checkOrder == orderId) {
                    checkOrderToDelete = true
                }
            }
            if (!checkOrderToDelete) {
                finalCallerOrders.push(orderId)
            }

            orders.push(order)
        }

        this.addressOrderIds(caller).set(finalCallerOrders)
        this.emitCancelOrderEvents(orders)
    }

    protected cancelAllOrdersHelper(): void {
        const caller = this.blockchain.caller
        const addressOrderIds = this.getAddressOrderIds(caller)

        const orderIdsNotEmpty = new MultiValueManagedArray<ManagedU64>()
        retainClosureValue(orderIdsNotEmpty)
        addressOrderIds.forEach((order) => {
            const thisRef = getContractInstance<OrdersModule>()
            const orderIdsNotEmptyRef = getRetainedClosureValue<ManagedArray<ManagedU64>>()
            if (!thisRef.orders(order).isEmpty()) {
                orderIdsNotEmptyRef.push(order)
            }
        })

        this.cancelOrdersHelper(orderIdsNotEmpty)
    }

    protected freeOrdersHelper(
        orderIds: ManagedArray<ManagedU64>
    ): void {
        const caller = this.blockchain.caller
        const addressOrderIds = this.getAddressOrderIds(caller)
        this.requireContainsNone(addressOrderIds.asManagedArray(), orderIds)

        const firstTokenIdentifier = this.firstTokenIdentifier
        const secondTokenIdentifier = this.secondTokenIdentifier
        const epoch = this.blockchain.currentBlockEpoch

        let orderIdsNotEmpty = new ManagedArray<ManagedU64>()
        retainClosureValue(orderIdsNotEmpty)
        orderIds.forEach((order) => {
            const thisRef = getContractInstance<OrdersModule>()
            const orderIdsNotEmptyRef = getRetainedClosureValue<ManagedArray<ManagedU64>>()

            if (!thisRef.orders(order).isEmpty()) {
                orderIdsNotEmptyRef.push(order)
            }

            retainClosureValue(orderIdsNotEmptyRef)
        })
        releaseRetainedClosureValue()

        const orders = new ManagedArray<Order>()
        retainClosureValue(
            MultiValue5.from(
                caller,
                firstTokenIdentifier,
                secondTokenIdentifier,
                epoch,
                orders
            )
        )
        orderIdsNotEmpty.forEach((orderId) => {
            const thisRef = getContractInstance<OrdersModule>()
            const refs = getRetainedClosureValue<MultiValue5<ManagedAddress, TokenIdentifier, TokenIdentifier, ManagedU64, ManagedArray<Order>>>()
            const callerRef = refs.a
            const firstTokenIdentifierRef = refs.b
            const secondTokenIdentifierRef = refs.c
            const epochRef = refs.d
            const ordersRef = refs.e

            const order = thisRef.freeOrder(
                orderId,
                callerRef,
                firstTokenIdentifierRef,
                secondTokenIdentifierRef,
                epochRef
            )
            ordersRef.push(order)

            retainClosureValue(refs)
        })
        releaseRetainedClosureValue()

        this.emitFreeOrderEvents(orders)
    }

    private freeOrder(
        orderId: ManagedU64,
        caller: ManagedAddress,
        firstTokenIdentifier: TokenIdentifier,
        secondTokenIdentifier: TokenIdentifier,
        epoch: ManagedU64
    ): Order {
        const order = this.orders(orderId).get()

        let tokenIdentifier: TokenIdentifier
        if (order.orderType == OrderType.Buy) {
            tokenIdentifier = secondTokenIdentifier
        } else {
            tokenIdentifier = firstTokenIdentifier
        }

        const penaltyCount = (epoch - order.createEpoch) / ManagedU64.fromValue(FEE_PENALTY_INCREASE_EPOCHS)

        this.require(
            penaltyCount >= ManagedU64.fromValue(FREE_ORDER_FROM_STORAGE_MIN_PENALTIES),
            "Too early to free order"
        )

        const penaltyPercent: ManagedU64 = penaltyCount * ManagedU64.fromValue(FEE_PENALTY_INCREASE_PERCENT)
        const penaltyAmount = this.ruleOfThree(
            penaltyPercent.toBigUint(),
            BigUint.fromU64(PERCENT_BASE_POINTS),
            order.inputAmount
        )
        const amount = order.inputAmount - penaltyAmount

        const creatorTransfer = Transfer.new(
            order.creator,
            Payment.new(
                tokenIdentifier,
                amount
            )
        )

        const callerTransfer = Transfer.new(
            caller,
            Payment.new(
                tokenIdentifier,
                penaltyAmount
            )
        )

        this.orders(orderId).clear()
        let transfers = new ManagedArray<Transfer>()
        transfers.push(creatorTransfer)
        transfers.push(callerTransfer)
        this.executeTransfers(transfers)

        return order
    }

    private cancelOrder(
        orderId: ManagedU64,
        caller: ManagedAddress,
        firstTokenId: TokenIdentifier,
        secondTokenId: TokenIdentifier,
        epoch: ManagedU64
    ): Order {
        const order = this.orders(orderId).get()

        let tokenId: TokenIdentifier
        if (order.orderType == OrderType.Buy) {
            tokenId = secondTokenId
        } else {
            tokenId = firstTokenId
        }


        const penaltyCount = (epoch - order.createEpoch) / ManagedU64.fromValue(FEE_PENALTY_INCREASE_EPOCHS)
        const penaltyPercent: ManagedU64 = penaltyCount * ManagedU64.fromValue(FEE_PENALTY_INCREASE_PERCENT)
        const penaltyAmount = this.ruleOfThree(
            penaltyPercent.toBigUint(),
            BigUint.fromU64(PERCENT_BASE_POINTS),
            order.inputAmount
        )
        const amount = order.inputAmount - penaltyAmount

        const transfer = Transfer.new(
            caller,
            Payment.new(
                tokenId,
                amount
            )
        )

        this.orders(orderId).clear()
        const transfers = ManagedArray.fromSingleItem(transfer)
        this.executeTransfers(transfers)

        return order
    }

    private loadOrders(
        orderIds: ManagedArray<ManagedU64>
    ): ManagedArray<Order> {
        const ordersArray = new ManagedArray<Order>()

        const orderIdsLength = orderIds.getLength()
        for (let i = ManagedU32.zero(); i < orderIdsLength; i++) {
            const order = orderIds.get(i)
            if (!this.orders(order).isEmpty()) {
                ordersArray.push(this.orders(order).get())
            }
        }

        return ordersArray
    }

    private createTransfers(
        orders: ManagedArray<Order>
    ): ManagedArray<Transfer> {
        const transfers = new ManagedArray<Transfer>()
        const firstTokenIdentifier = this.firstTokenIdentifier
        const secondTokenIdentifier = this.secondTokenIdentifier


        const buyOrders = this.getOrdersWithType(orders, OrderType.Buy)
        const sellOrders = this.getOrdersWithType(orders, OrderType.Sell)

        const buyTokenSums = this.getOrdersSumUp(buyOrders)
        const secondTokenPaid = buyTokenSums.a
        const firstTokenRequested = buyTokenSums.b


        const sellTokenSums = this.getOrdersSumUp(sellOrders)
        const firstTokenPaid = sellTokenSums.a
        const secondTokenRequested = sellTokenSums.b

        this.require(
            firstTokenPaid >= firstTokenRequested,
            "Orders mismatch: Not enough first Token"
        )

        this.require(
            secondTokenPaid >= secondTokenRequested,
            "Orders mismatch: Not enough second Token"
        )

        const firstTokenLeftover = firstTokenPaid - firstTokenRequested
        const secondTokenLeftover = secondTokenPaid - secondTokenRequested


        const buyersTransfers = this.calculateTransfers(
            buyOrders,
            secondTokenPaid,
            firstTokenIdentifier,
            firstTokenLeftover
        )
        transfers.appendArray(buyersTransfers)

        const sellersTransfers = this.calculateTransfers(
            sellOrders,
            firstTokenPaid,
            secondTokenIdentifier,
            secondTokenLeftover
        )
        transfers.appendArray(sellersTransfers)

        return transfers
    }

    private executeTransfers(
        transfers: ManagedArray<Transfer>
    ): void {
        const transfersLength = transfers.getLength()
        for (let i = ManagedU32.zero(); i < transfersLength; i++) {
            const transfer = transfers.get(i)
            if (transfer.payment.amount > BigUint.zero()) {
                this.send.direct(
                    transfer.to,
                    transfer.payment.tokenIdentifier,
                    ManagedU64.zero(),
                    transfer.payment.amount
                )
            }
        }
    }

    private getOrdersSumUp(
        orders: ManagedArray<Order>
    ): MultiValue2<BigUint, BigUint> {
        let amountPaid = BigUint.zero()
        let amountRequested = BigUint.zero()

        retainClosureValue(MultiValue2.from(amountPaid, amountRequested))
        orders.forEach((order) => {
            const refs = getRetainedClosureValue<MultiValue2<BigUint, BigUint>>()
            const amountPaidRef = refs.a
            const amountRequestedRef = refs.b

            retainClosureValue(
                MultiValue2.from(
                    amountPaidRef + order.inputAmount,
                    amountRequestedRef + order.outputAmount
                )
            )
        })

        return getRetainedClosureValue<MultiValue2<BigUint, BigUint>>()
    }

    private getOrdersWithType(
        orders: ManagedArray<Order>,
        orderType: OrderType
    ): ManagedArray<Order> {
        const ordersArray = new ManagedArray<Order>()

        let ordersLength = orders.getLength()

        for (let i = ManagedU32.zero(); i < ordersLength; i++) {
            const order = orders.get(i)

            if (order.orderType == orderType) {
                ordersArray.push(order)
            }
        }

        return ordersArray
    }

    private calculateTransfers(
        orders: ManagedArray<Order>,
        totalPaid: BigUint,
        tokenRequested: TokenIdentifier,
        leftover: BigUint
    ): ManagedArray<Transfer> {
        const transfers = new ManagedArray<Transfer>()
        const matchProviderTransfer = Transfer.new(
            this.blockchain.caller,
            Payment.new(
                tokenRequested,
                BigUint.zero()
            )
        )

        for (let i = ManagedU32.zero(); i < orders.getLength(); i++) {
            const order = orders.get(i)
            const matchProviderAmount = this.calculateFeeAmount(
                order.outputAmount,
                order.feeConfig
            )

            const creatorAmount = order.outputAmount - matchProviderAmount
            const orderDeal = this.ruleOfThree(
                order.inputAmount,
                totalPaid,
                leftover
            )
            const matchProviderDealAmount = this.ruleOfThree(
                order.dealConfig.matchProviderPercent.toBigUint(),
                BigUint.fromU64(PERCENT_BASE_POINTS),
                orderDeal
            )
            const createDealAmount = orderDeal - matchProviderDealAmount

            transfers.push(
                Transfer.new(
                    order.creator,
                    Payment.new(
                        tokenRequested,
                        creatorAmount + createDealAmount
                    )
                )
            )

            matchProviderTransfer.payment.amount += matchProviderAmount + matchProviderDealAmount
        }

        transfers.push(matchProviderTransfer)

        return transfers
    }

    private clearOrders(
        orderIds: ManagedArray<ManagedU64>
    ): void {
        orderIds.forEach((id) => {
            const thisRef = getContractInstance<OrdersModule>()
            thisRef.orders(id).clear()
        })
    }

    private emitMatchOrderEvents(
        orders: ManagedArray<Order>
    ): void {
        const caller = this.blockchain.caller
        const epoch = this.blockchain.currentBlockEpoch

        retainClosureValue(
            MultiValue2.from(
                caller,
                epoch
            )
        )

        orders.forEach((order) => {
            const refs = getRetainedClosureValue<MultiValue2<ManagedAddress, ManagedU64>>()
            const callerRef = refs.a
            const epochRef = refs.b

            const event = new MatchOrderEvent(
                ManagedBuffer.fromString('match_order'),
                MultiValue5.from(
                    callerRef,
                    epochRef,
                    order.orderType,
                    order.id,
                    order.creator
                ),
                ManagedBuffer.fromString('')
            )
            event.emit()

            retainClosureValue(refs)
        })

        releaseRetainedClosureValue()
    }

    private emitFreeOrderEvents(
        orders: ManagedArray<Order>
    ): void {
        const caller = this.blockchain.caller
        const epoch = this.blockchain.currentBlockEpoch

        retainClosureValue(
            MultiValue2.from(
                caller,
                epoch
            )
        )

        orders.forEach((order) => {
            const refs = getRetainedClosureValue<MultiValue2<ManagedAddress, ManagedU64>>()
            const callerRef = refs.a
            const epochRef = refs.b

            const event = new FreeOrderEvent(
                ManagedBuffer.fromString('free_order'),
                MultiValue5.from(
                    callerRef,
                    epochRef,
                    order.orderType,
                    order.id,
                    order.creator
                ),
                ManagedBuffer.fromString('')
            )
            event.emit()

            retainClosureValue(refs)
        })
        releaseRetainedClosureValue()
    }

    private emitCancelOrderEvents(
        orders: ManagedArray<Order>
    ): void {
        const caller = this.blockchain.caller
        const epoch = this.blockchain.currentBlockEpoch

        retainClosureValue(
            MultiValue2.from(
                caller,
                epoch
            )
        )

        orders.forEach((order) => {
            const refs = getRetainedClosureValue<MultiValue2<ManagedAddress, ManagedU64>>()
            const callerRef = refs.a
            const epochRef = refs.b

            const event = new CancelOrderEvent(
                ManagedBuffer.fromString('cancel_order'),
                MultiValue4.from(
                    callerRef,
                    epochRef,
                    order.orderType,
                    order.id
                ),
                ManagedBuffer.fromString('')
            )
            event.emit()

            retainClosureValue(refs)
        })
        releaseRetainedClosureValue()
    }

    private emitOrderEvent(
        order: Order
    ): void {
        const caller = this.blockchain.caller
        const epoch = this.blockchain.currentBlockEpoch
        const orderType = order.orderType


        const event = new OrderEvent(
            ManagedBuffer.fromString('order'),
            MultiValue3.from(
                caller,
                epoch,
                orderType
            ),
            order
        )
        event.emit()
    }

    abstract orderIdCounter(): Mapping<ManagedU64>
    abstract orders(id: ManagedU64): Mapping<Order>
    abstract addressOrderIds(address: ManagedAddress): Mapping<ManagedArray<ManagedU64>>

}
