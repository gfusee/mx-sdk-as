//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ManagedEvent,
    ManagedBuffer,
    ManagedAddress,
    Mapping,
    MultiValue1,
    MultiValue2
} from "@gfusee/mx-sdk-as";

class TopUpEvent extends ManagedEvent<MultiValue1<ManagedAddress>, BigUint> {}
class WithdrawEvent extends ManagedEvent<MultiValue1<ManagedAddress>, BigUint> {}
class PlayerJoinsGameEvent extends ManagedEvent<MultiValue2<BigUint, ManagedAddress>, BigUint> {}
class RewardWinnerEvent extends ManagedEvent<MultiValue2<BigUint, ManagedAddress>, BigUint> {}

@contract
abstract class CryptoBubbles extends ContractBase {

    topUp(): void {
        const payment = this.callValue.egldValue
        const caller = this.blockchain.caller

        const oldPlayerBalance = this.playerBalance(caller).get()
        this.playerBalance(caller).set(oldPlayerBalance + payment)

        const event = new TopUpEvent(
            ManagedBuffer.fromString('top_up'),
            MultiValue1.from(caller),
            payment
        )
        event.emit()
    }

    withdraw(
        amount: BigUint
    ): void {
        this.transferBackToPlayerWallet(
            this.blockchain.caller,
            amount
        )
    }

    joinGame(
        gameIndex: BigUint
    ): void {
        const bet = this.callValue.egldValue
        const player = this.blockchain.caller

        this.topUp()
        this.addPlayerToGameStateChange(gameIndex, player, bet)
    }

    @onlyOwner
    rewardWinner(
        gameIndex: BigUint,
        winner: ManagedAddress,
        prize: BigUint
    ): void {
        const oldPlayerBalance = this.playerBalance(winner).get()
        this.playerBalance(winner).set(oldPlayerBalance + prize)

        const event = new RewardWinnerEvent(
            ManagedBuffer.fromString('reward_winner'),
            MultiValue2.from(
                gameIndex,
                winner
            ),
            prize
        )
        event.emit()
    }

    rewardAndSendToWallet(
        gameIndex: BigUint,
        winner: ManagedAddress,
        prize: BigUint
    ): void {
        this.rewardWinner(gameIndex, winner, prize)
        this.transferBackToPlayerWallet(winner, prize)
    }

    @view
    balanceOf(
        player: ManagedAddress
    ): BigUint {
        return this.playerBalance(player).get()
    }

    private transferBackToPlayerWallet(
        player: ManagedAddress,
        amount: BigUint
    ): void {
        const oldPlayerBalance = this.playerBalance(player).get()
        this.require(
            amount <= oldPlayerBalance,
            "amount to withdraw must be less or equal to balance"
        )
        this.playerBalance(player).set(oldPlayerBalance - amount)

        this.send.directEgld(player, amount)

        const event = new WithdrawEvent(
            ManagedBuffer.fromString("withdraw"),
            MultiValue1.from(player),
            amount
        )
        event.emit()
    }

    private addPlayerToGameStateChange(
        gameIndex: BigUint,
        player: ManagedAddress,
        bet: BigUint
    ): void {
        const oldPlayerBalance = this.playerBalance(player).get()
        this.require(
            bet <= oldPlayerBalance,
            "insufficient funds to join game"
        )

        this.playerBalance(player).set(oldPlayerBalance - bet)

        const event = new PlayerJoinsGameEvent(
            ManagedBuffer.fromString('player_joins_game'),
            MultiValue2.from(
                gameIndex,
                player
            ),
            bet
        )
        event.emit()
    }

    abstract playerBalance(address: ManagedAddress): Mapping<BigUint>

}
