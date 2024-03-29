//@ts-nocheck

import {
    BigUint, ContractBase, ManagedBuffer, ManagedU32, ManagedU64, ManagedAddress, Mapping, TokenIdentifier
} from "@gfusee/mx-sdk-as";
import {DepositInfo} from "./deposit-info";

const SECONDS_PER_ROUND: u64 = 6

@contract
abstract class DigitalCash extends ContractBase {

    fund(
        address: ManagedAddress,
        valability: ManagedU64
    ): void {
        const payment = this.callValue.singlePayment

        this.require(
            payment.amount > BigUint.zero(),
            "amount must be greater than 0"
        )

        this.require(
            this.deposit(address).isEmpty(),
            "key already used"
        )

        const deposit = DepositInfo.new(
            payment.amount,
            this.blockchain.caller,
            this.getExpirationRound(valability),
            payment.tokenIdentifier,
            payment.tokenNonce
        )

        this.deposit(address).set(deposit)
    }

    withdraw(
        address: ManagedAddress
    ): void {
        this.require(
            !this.deposit(address).isEmpty(),
            "non-existent key"
        )

        const deposit = this.deposit(address).get()

        this.require(
            deposit.expirationRound < this.blockchain.currentBlockRound,
            "withdrawal has not been available yet"
        )

        this.send.direct(
            deposit.depositorAddress,
            deposit.tokenName,
            deposit.nonce,
            deposit.amount
        )

        this.deposit(address).clear()
    }

    claim(
        address: ManagedAddress,
        signature: ManagedBuffer
    ): void {
        this.require(
            !this.deposit(address).isEmpty(),
            "non-existent key"
        )

        const deposit = this.deposit(address).get()
        const callerAddress = this.blockchain.caller

        this.require(
            deposit.expirationRound >= this.blockchain.currentBlockRound,
            "deposit expired"
        )

        const key = address.buffer
        const message = callerAddress.buffer

        this.require(
            this.crypto.verifyEd25519LegacyManaged(
                ManagedU32.fromValue(32),
                key,
                message,
                signature
            ),
            "invalid signature"
        )

        this.send.direct(
            callerAddress,
            deposit.tokenName,
            deposit.nonce,
            deposit.amount
        )

        this.deposit(address).clear()
    }

    @view
    getAmount(address: ManagedAddress): BigUint {
        this.require(
            !this.deposit(address).isEmpty(),
            "non-existent key"
        )

        const data = this.deposit(address).get()
        return data.amount
    }

    @view
    getDeposit(donor: ManagedAddress): DepositInfo {
        return this.deposit(donor).get()
    }

    private getExpirationRound(
        valability: ManagedU64
    ): ManagedU64 {
        const valabilityRounds = valability / ManagedU64.fromValue(SECONDS_PER_ROUND)
        return this.blockchain.currentBlockRound + valabilityRounds
    }

    abstract deposit(donor: ManagedAddress): Mapping<DepositInfo>

}
