//@ts-nocheck

import {
    BigUint,
    ContractBase,
    TokenIdentifier,
    ManagedU64,
    ManagedAddress,
    Mapping
} from "@gfusee/mx-sdk-as";
import { Status } from "./status";

@contract
abstract class CounterContract extends ContractBase {

    tokenIdentifier!: TokenIdentifier
    target!: BigUint
    deadline!: ManagedU64

    constructor(
        target: BigUint,
        deadline: ManagedU64,
        tokenIdentifier: TokenIdentifier
    ) {
        this.require(
            target > BigUint.zero(),
            "Target must be more than 0"
        )
        this.target = target

        this.require(
            deadline > this.getCurrentTime(),
            "Deadline can't be in the past"
        )
        this.deadline = deadline

        this.require(
            tokenIdentifier.isValid(),
            "Invalid token provided"
        )
        this.tokenIdentifier = tokenIdentifier
    }

    fund(): void {
        const payment = this.callValue.singlePayment

        this.require(
            this.status() == Status.FundingPeriod,
            "cannot fund after deadline"
        )
        this.require(
            payment.tokenIdentifier == this.tokenIdentifier,
            "wrong token"
        )

        const caller = this.blockchain.caller
        this.deposit(caller).set(payment.amount)
    }

    @view
    status(): Status {
        if (this.getCurrentTime() < this.deadline) {
            return Status.FundingPeriod
        } else if (this.getCurrentFunds() >= this.target) {
            return Status.Successful
        } else {
            return Status.Failed
        }
    }

    @view
    getCurrentFunds(): BigUint {
        const token = this.tokenIdentifier

        return this.blockchain.getSCBalance(token, ManagedU64.fromValue(0))
    }

    claim(): void {
        switch (this.status().value) {
            case Status.FundingPeriod.value: {
                this.panic("cannot claim before deadline")
            }
            case Status.Successful.value: {
                const caller = this.blockchain.caller
                this.require(
                    caller == this.blockchain.owner,
                    "only owner can claim successful funding"
                )

                const tokenIdentifier = this.tokenIdentifier
                const scBalance = this.getCurrentFunds()

                this.send
                    .direct(
                        caller,
                        tokenIdentifier,
                        ManagedU64.fromValue(0),
                        scBalance
                    )
            }
            case Status.Failed.value: {
                const caller = this.blockchain.caller
                const deposit = this.deposit(caller).get()

                if (deposit > BigUint.zero()) {
                    this.deposit(caller).set(BigUint.fromU64(0))
                    this.send
                    .direct(
                        caller,
                        this.tokenIdentifier,
                        ManagedU64.fromValue(0),
                        deposit
                    )
                }
            }
        }
    }

    @view
    getTarget(): BigUint {
        return this.target
    }

    @view
    getDeadline(): ManagedU64 {
        return this.deadline
    }

    @view
    getDeposit(donor: ManagedAddress): BigUint {
        return this.deposit(donor).get()
    }

    @view
    getCrowdfundingTokenIdentifier(): TokenIdentifier {
        return this.tokenIdentifier
    }

    private getCurrentTime(): ManagedU64 {
        return this.blockchain.currentBlockTimestamp
    }

    abstract deposit(address: ManagedAddress): Mapping<BigUint>

}
