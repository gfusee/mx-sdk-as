//@ts-nocheck

import {
    ArrayMapping,
    BigUint,
    ContractBase,
    ManagedArray,
    ManagedBuffer,
    ManagedU32,
    ManagedU64,
    ManagedU8,
    getContractInstance,
    ManagedAddress,
    Mapping,
    Option,
    OptionalValue,
    TokenIdentifier,
    UnorderedSetMapping,
    ESDTLocalRoleFlag,
    RandomnessSource
} from "@gfusee/mx-sdk-as"
import { LotteryInfo } from "./lotteryInfo"
import { Status } from "./status"

const PERCENTAGE_TOTAL: u32 = 100
const THIRTY_DAYS_IN_SECONDS: u64 = 60 * 60 * 24 * 30
const MAX_TICKETS: u32 = 800

@contract
abstract class LotteryContract extends ContractBase {

    start(
        lotteryName: ManagedBuffer,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ManagedU32>,
        optDeadline: Option<ManagedU64>,
        optMaxEntriesPerUser: Option<ManagedU32>,
        optPrizeDistribution: Option<ManagedArray<ManagedU8>>,
        optWhitelist: Option<ManagedArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): void {
        this.startLottery(
            lotteryName,
            tokenIdentifier,
            ticketPrice,
            optTotalTickets,
            optDeadline,
            optMaxEntriesPerUser,
            optPrizeDistribution,
            optWhitelist,
            optBurnPercentage
        )
    }

    createLotteryPool(
        lotteryName: ManagedBuffer,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ManagedU32>,
        optDeadline: Option<ManagedU64>,
        optMaxEntriesPerUser: Option<ManagedU32>,
        optPrizeDistribution: Option<ManagedArray<ManagedU8>>,
        optWhitelist: Option<ManagedArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): void {
        this.startLottery(
            lotteryName,
            tokenIdentifier,
            ticketPrice,
            optTotalTickets,
            optDeadline,
            optMaxEntriesPerUser,
            optPrizeDistribution,
            optWhitelist,
            optBurnPercentage
        )
    }

    buyTicket(lotteryName: ManagedBuffer): void {
        const payment = this.callValue.singlePayment

        const status = this.status(lotteryName)

        //TODO : make switch statement works
        if (status == Status.Inactive) {
            this.panic("Lottery is currently inactive.")
        } else if (status == Status.Running) {
            this.updateAfterBuyTicket(lotteryName, payment.tokenIdentifier, payment.amount)
        } else {
            this.panic("Lottery entry period has ended! Awaiting winner announcement.")
        }
    }

    determineWinner(lotteryName: ManagedBuffer): void {
        const status = this.status(lotteryName)

        if (status == Status.Inactive) {
            this.panic("Lottery is inactive!")
        } else if (status == Status.Running) {
            this.panic("Lottery is still running!")
        } else {
            this.determinePrizes(lotteryName)
            this.clearStorage(lotteryName)
        }
    }

    @view
    status(lotteryName: ManagedBuffer): Status {
        if (this.lotteryInfo(lotteryName).isEmpty()) {
            return Status.Inactive
        }

        const infos = this.lotteryInfo(lotteryName).get()
        const currentTime = this.blockchain.currentBlockTimestamp
        if (currentTime > infos.deadline || infos.ticketsLeft == ManagedU32.zero()) {
            return Status.Ended
        }

        return Status.Running
    }

    @view
    getLotteryInfo(
        lotteryName: ManagedBuffer
    ): LotteryInfo {
        return this.lotteryInfo(lotteryName).get()
    }

    private startLottery(
        lotteryName: ManagedBuffer,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ManagedU32>,
        optDeadline: Option<ManagedU64>,
        optMaxEntriesPerUser: Option<ManagedU32>,
        optPrizeDistribution: Option<ManagedArray<ManagedU8>>,
        optWhitelist: Option<ManagedArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): void {
        this.require(
            !lotteryName.isEmpty(),
            "Name can't be empty"
        )

        const timestamp = this.blockchain.currentBlockTimestamp
        const totalTickets = optTotalTickets.unwrapOr(ManagedU32.fromValue(MAX_TICKETS))
        const deadline = optDeadline.unwrapOr(timestamp + ManagedU64.fromValue(THIRTY_DAYS_IN_SECONDS))
        const maxEntriesPerUser = optMaxEntriesPerUser.unwrapOr(ManagedU32.fromValue(MAX_TICKETS))
        let prizeDistribution = optPrizeDistribution.unwrapOrNull()
        if (prizeDistribution === null) {
            prizeDistribution = new ManagedArray<ManagedU8>()
            prizeDistribution.push(ManagedU8.fromValue(PERCENTAGE_TOTAL as u8))
        }

        this.require(
            this.status(lotteryName).value == Status.Inactive.value,
            "Lottery is already active!"
        )

        this.require(
            tokenIdentifier.isValid(),
            "Invalid token name provided!"
        )

        this.require(
            ticketPrice > BigUint.zero(),
            "Ticket price must be higher than 0!"
        )

        this.require(
            totalTickets > ManagedU32.zero(),
            "Must have more than 0 tickets available!"
        )

        this.require(
            totalTickets <= ManagedU32.fromValue(MAX_TICKETS),
            "Only 800 or less total tickets per lottery are allowed!"
        )

        this.require(
            deadline > timestamp,
            "Deadline can't be in the past!"
        )

        this.require(
            deadline <= timestamp + ManagedU64.fromValue(THIRTY_DAYS_IN_SECONDS),
            "Deadline can't be later than 30 days from now!"
        )

        this.require(
            maxEntriesPerUser > ManagedU32.zero(),
            "Must have more than 0 max entries per user!"
        )

        this.require(
            this.sumArray(prizeDistribution) == ManagedU32.fromValue(PERCENTAGE_TOTAL),
            "Prize distribution must add up to exactly 100(%)!"
        )

        if (!optBurnPercentage.isNull()) {
            this.require(
                !tokenIdentifier.isEgld(),
                "EGLD can't be burned!"
            )

            const roles = this.blockchain.getESDTLocalRoles(tokenIdentifier)
            this.require(
                roles.hasRole(ESDTLocalRoleFlag.BURN),
                "The contract can't burn the selected token!"
            )

            const burnPercentage = optBurnPercentage.unwrap()
            this.require(
                burnPercentage < BigUint.fromU64(PERCENTAGE_TOTAL),
                "Invalid burn percentage!"
            )

            this.burnPercentageForLottery(lotteryName).set(burnPercentage)
        }

        if (!optWhitelist.isNull()) {
            const whitelist = optWhitelist.unwrap()
            const mapping = this.lotteryWhitelist(lotteryName)
            const whitelistLength = whitelist.getLength()
            for (let i = ManagedU32.zero(); i < whitelistLength; i++) {
                const addr = whitelist.get(i)
                mapping.insert(addr)
            }
        }

        const infos = LotteryInfo.new(
            tokenIdentifier,
            ticketPrice,
            totalTickets,
            deadline,
            maxEntriesPerUser,
            prizeDistribution,
            BigUint.zero()
        )

        this.lotteryInfo(lotteryName).set(infos)
    }

    private updateAfterBuyTicket(
        lotteryName: ManagedBuffer,
        tokenIdentifier: TokenIdentifier,
        payment: BigUint
    ): void {
        const infoMapper = this.lotteryInfo(lotteryName)
        const info = infoMapper.get()
        const caller = this.blockchain.caller
        const whitelist = this.lotteryWhitelist(lotteryName)

        this.require(
            whitelist.isEmpty() || whitelist.includes(caller),
            "You are not allowed to participate in this lottery!"
        )

        this.require(
            tokenIdentifier == info.tokenIdentifier && payment == info.ticketPrice,
            "Wrong ticket fee!"
        )

        const entriesMapper = this.numberOfEntriesForUser(lotteryName, caller)
        let entries = entriesMapper.get()

        this.require(
            entries < info.maxEntriesPerUser,
            "Ticket limit exceeded for this lottery!"
        )

        this.ticketHolder(lotteryName).push(caller)

        entries += ManagedU32.fromValue(1)
        info.ticketsLeft -= ManagedU32.fromValue(1)
        info.prizePool += info.ticketPrice

        entriesMapper.set(entries)
        infoMapper.set(info)
    }

    private determinePrizes(lotteryName: ManagedBuffer): void {
        const info = this.lotteryInfo(lotteryName).get()
        const ticketHoldersMapping = this.ticketHolder(lotteryName)
        const totalTickets = ticketHoldersMapping.getLength()

        if (totalTickets == ManagedU32.zero()) {
            return
        }

        const burnPercentage = this.burnPercentageForLottery(lotteryName).get()
        if (burnPercentage > BigUint.zero()) {
            const burnAmount = this.calculatePercentageOf(info.prizePool, burnPercentage)

            const esdtTokenId = info.tokenIdentifier
            const roles = this.blockchain.getESDTLocalRoles(esdtTokenId)

            if (roles.hasRole(ESDTLocalRoleFlag.BURN)) {
                this.send.esdtLocalBurn(esdtTokenId, ManagedU64.zero(), burnAmount)
            }

            info.prizePool -= burnAmount
        }

        // if there are less tickets than the distributed prize pool,
        // the 1st place gets the leftover, maybe could split between the remaining
        // but this is a rare case anyway and it's not worth the overhead
        let totalWinningTickets: ManagedU32
        const infoPrizeDistributionLength = info.prizeDistribution.getLength()
        if (totalTickets < infoPrizeDistributionLength) {
            totalWinningTickets = totalTickets
        } else {
            totalWinningTickets = infoPrizeDistributionLength
        }

        const totalPrize = info.prizePool
        const winningTickets = this.getDistinctRandom(ManagedU32.fromValue(1), totalTickets, totalWinningTickets)

        // distribute to the first place last. Laws of probability say that order doesn't matter.
        // this is done to mitigate the effects of BigUint division leading to "spare" prize money being left out at times
        // 1st place will get the spare money instead.
        for (let i: u32 = 1; i <= totalWinningTickets.value; i++) {
            const reversed = totalWinningTickets.value - i //TODO : reverse function
            const winningTicketId = winningTickets[reversed]
            const winningAddress = ticketHoldersMapping.get(winningTicketId)
            const prize = this.calculatePercentageOf(
                totalPrize,
                BigUint.fromU64(info.prizeDistribution[reversed].value as u64)
            )

            this.send
                .direct(
                    winningAddress,
                    info.tokenIdentifier,
                    ManagedU64.zero(),
                    prize
                )

            info.prizePool -= prize
        }


        // send leftover to first place
        const firstPlaceWinner = ticketHoldersMapping.get(winningTickets[0]) //TODO : add getter for managed type ? .value as i32 is ugly
        if (info.prizePool > BigUint.zero()) {
            this.send
            .direct(
                firstPlaceWinner,
                info.tokenIdentifier,
                ManagedU64.zero(),
                info.prizePool
            )
        }
    }

    /// does not check if max - min >= amount, that is the adder's job
    private getDistinctRandom(
        min: ManagedU32,
        max: ManagedU32,
        amount: ManagedU32
    ): ManagedArray<ManagedU32> {
        //TODO : use managed types
        const result = new ManagedArray<ManagedU32>()
        const randNumbers = new Uint32Array(MAX_TICKETS)

        for (let i = min.value; i <= max.value; i++) {
            randNumbers[i - min.value] = i
        }

        const totalNumbers = (max - min) + ManagedU32.fromValue(1)

        for (let i: u32 = 0; i < amount.value; i++) {
            const randIndex = RandomnessSource.nextU32InRange(ManagedU32.zero(), totalNumbers)
            const swapTemp = randNumbers[i]
            randNumbers[i] = randNumbers[randIndex.value]
            randNumbers[randIndex.value] = swapTemp
        }

        for (let i = 0; i < randNumbers.length; i++) {
            result.push(ManagedU32.fromValue(randNumbers[i]))
        }

        return result
    }

    private clearStorage(lotteryName: ManagedBuffer): void {
        const ticketHolderMapping = this.ticketHolder(lotteryName)

        const ticketHolderMappingLength = ticketHolderMapping.getLength()
        // /!\ ArrayMapping starts at index 1
        for (let i = ManagedU32.fromValue(1); i <= ticketHolderMappingLength; i++) {
            const addr = ticketHolderMapping.get(i)
            this.numberOfEntriesForUser(lotteryName, addr).clear()
        }

        ticketHolderMapping.clear()
        this.lotteryInfo(lotteryName).clear()
        this.lotteryWhitelist(lotteryName).clear()
        this.burnPercentageForLottery(lotteryName).clear()
    }

    private calculatePercentageOf(value: BigUint, percentage: BigUint): BigUint {
        return value * percentage / BigUint.fromU64(PERCENTAGE_TOTAL as u64)
    }

    private sumArray(array: ManagedArray<ManagedU8>): ManagedU32 {
        let result = ManagedU32.zero()

        const arrayLength = array.getLength().value as i32
        for (let i = 0; i < arrayLength; i++) {
            result += ManagedU32.fromValue(array[i].value as u32)
        }

        return result
    }

    abstract ticketHolder(lotteryName: ManagedBuffer): ArrayMapping<ManagedAddress>
    abstract lotteryInfo(lotteryName: ManagedBuffer): Mapping<LotteryInfo>
    abstract lotteryWhitelist(lotteryName: ManagedBuffer): UnorderedSetMapping<ManagedAddress>
    abstract numberOfEntriesForUser(lotteryName: ManagedBuffer, caller: ManagedAddress): Mapping<ManagedU32>
    abstract burnPercentageForLottery(lotteryName: ManagedBuffer): Mapping<BigUint>

}
