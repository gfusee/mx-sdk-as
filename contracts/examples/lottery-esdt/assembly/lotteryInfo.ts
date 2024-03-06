//@ts-nocheck

import { BigUint, ManagedArray, ManagedU32, ManagedU64, ManagedU8, TokenIdentifier } from "@gfusee/mx-sdk-as";

@struct
export class LotteryInfo {
    tokenIdentifier!: TokenIdentifier
    ticketPrice!: BigUint
    ticketsLeft!: ManagedU32
    deadline!: ManagedU64
    maxEntriesPerUser!: ManagedU32
    prizeDistribution!: ManagedArray<ManagedU8>
    prizePool!: BigUint

    static new(
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        ticketsLeft: ManagedU32,
        deadline: ManagedU64,
        maxEntriesPerUser: ManagedU32,
        prizeDistribution: ManagedArray<ManagedU8>,
        prizePool: BigUint,
    ): LotteryInfo {
        const result = new LotteryInfo()

        result.tokenIdentifier = tokenIdentifier
        result.ticketPrice = ticketPrice
        result.ticketsLeft = ticketsLeft
        result.deadline = deadline
        result.maxEntriesPerUser = maxEntriesPerUser
        result.prizeDistribution = prizeDistribution
        result.prizePool = prizePool

        return result
    }
}
