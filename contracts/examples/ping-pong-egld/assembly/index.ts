//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ElrondString,
    ElrondU32,
    ElrondU64, ManagedAddress,
    Mapping, MultiValueEncoded,
    Option,
    OptionalValue,
    TokenIdentifier,
    UserMapping
} from "@gfusee/elrond-wasm-as";
import {UserStatus} from "./userStatus";

const PONG_ALL_LOW_GAS_LIMIT: u64 = 3000000

@contract
abstract class PingPong extends ContractBase {

    pingAmount: BigUint
    deadline: ElrondU64
    activationTimestamp: ElrondU64
    maxFunds: Option<BigUint>
    pongAllLastUser: ElrondU32

    constructor(
        pingAmount: BigUint,
        durationInSeconds: ElrondU64,
        optActivationTimestamp: Option<ElrondU64>,
        maxFunds: OptionalValue<BigUint>
    ) {
        super()

        this.pingAmount = pingAmount

        let activationTimestamp: ElrondU64
        if (optActivationTimestamp.isNull()) {
            activationTimestamp = this.blockchain.currentBlockTimestamp
        } else {
            activationTimestamp = optActivationTimestamp.unwrap()
        }

        this.deadline = activationTimestamp + durationInSeconds
        this.activationTimestamp = activationTimestamp
        this.maxFunds = maxFunds.intoOption()
    }

    ping(): void {
        const payment = this.callValue.egldValue

        this.require(
            payment == this.pingAmount,
            "the payment must match the fixed sum"
        )

        const blockTimestamp = this.blockchain.currentBlockTimestamp

        this.require(
            this.activationTimestamp <= blockTimestamp,
            "smart contract not active yet"
        )

        this.require(
            blockTimestamp < this.deadline,
            "deadline has passed"
        )

        if (!this.maxFunds.isNull()) {
            const maxFunds = this.maxFunds.unwrap()
            this.require(
                this.blockchain.getSCBalance(
                    TokenIdentifier.egld(),
                    ElrondU64.zero()
                ) + payment <= maxFunds,
                "smart contract full"
            )
        }

        const caller = this.blockchain.caller
        const userId = this.user().getOrCreateUser(caller)
        const userStatus = this.userStatus(userId).get()
        if (userStatus == UserStatus.New) {
            this.userStatus(userId).set(UserStatus.Registered)
        } else if (userStatus == UserStatus.Registered) {
            throw new Error("can only ping once")
        } else { //UserStatus.Withdrawn
            throw new Error("already withdrawn")
        }
    }

    pong(): void {
        this.require(
            this.blockchain.currentBlockTimestamp >= this.deadline,
            "can't withdraw before deadline"
        )

        const caller = this.blockchain.caller
        const userId = this.user().getUserId(caller)

        const error = this.pongByUserId(userId)

        if (error) {
            throw new Error(error!!)
        }
    }

    pongAll(): ElrondString {
        this.require(
            this.blockchain.currentBlockTimestamp >= this.deadline,
            "can't withdraw before deadline"
        )

        const numUsers = this.user().getUserCount()
        let pongAllLastUser = this.pongAllLastUser
        const pongAllGasLimit = ElrondU64.fromValue(PONG_ALL_LOW_GAS_LIMIT)
        while (true) {
            if (pongAllLastUser >= numUsers) {
                pongAllLastUser = ElrondU32.zero()
                this.pongAllLastUser = pongAllLastUser
                return ElrondString.fromString("completed")
            }

            if (this.blockchain.getGasLeft() < pongAllGasLimit) {
                this.pongAllLastUser = pongAllLastUser
                return ElrondString.fromString("interrupted")
            }

            pongAllLastUser += ElrondU32.fromValue(1)

            this.pongByUserId(pongAllLastUser)
        }
    }

    @view
    getUserAddresses(): MultiValueEncoded<ManagedAddress> {
        return this.user().getAllAddresses().toMultiValueEncoded()
    }

    @view
    getPingAmount(): BigUint {
        return this.pingAmount
    }

    @view
    getDeadline(): ElrondU64 {
        return this.deadline
    }

    @view
    getActivationTimestamp(): ElrondU64 {
        return this.activationTimestamp
    }

    @view
    getMaxFunds(): Option<BigUint> {
        return this.maxFunds
    }

    @view
    getUserStatus(userId: ElrondU32): UserStatus {
        return this.userStatus(userId).get()
    }

    @view
    getPongAllLastUser(): ElrondU32 {
        return this.pongAllLastUser
    }

    private pongByUserId(userId: ElrondU32): string | null {
        const userStatus = this.userStatus(userId).get()

        if (userStatus == UserStatus.New) {
            return "can't pong, never pinged"
        } else if (userStatus == UserStatus.Registered) {
            this.userStatus(userId).set(UserStatus.Withdrawn)
            const optUserAddress = this.user().getUserAddress(userId)

            if (optUserAddress.isNull()) {
                return "unknown user"
            } else {
                const userAddress = optUserAddress.unwrap()
                this.send
                    .directEgld(
                        userAddress,
                        this.pingAmount
                    )
            }
        } else if (userStatus == UserStatus.Withdrawn) {
            return "already withdrawn"
        }

        return null
    }

    abstract user(): UserMapping
    abstract userStatus(id: ElrondU32): Mapping<UserStatus>

}
