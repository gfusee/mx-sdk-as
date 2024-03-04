//@ts-nocheck

import {
    BigUint,
    CallableContract, ContractCall,
    ManagedArray,
    ManagedBuffer,
    ManagedU32,
    ManagedU64,
    ManagedU8, ManagedVoid,
    ManagedAddress,
    Option, OptionalValue,
    TokenIdentifier
} from "@gfusee/mx-sdk-as";

@callable
export abstract class LotteryEsdtContract extends CallableContract {

    abstract start(
        lotteryName: ManagedBuffer,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ManagedU32>,
        optDeadline: Option<ManagedU64>,
        optMaxEntriesPerUser: Option<ManagedU32>,
        optPrizeDistribution: Option<ManagedArray<ManagedU8>>,
        optWhitelist: Option<ManagedArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): ContractCall<ManagedVoid>

}
