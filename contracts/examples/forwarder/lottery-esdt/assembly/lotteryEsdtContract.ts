//@ts-nocheck

import {
    BigUint,
    CallableContract, ContractCall,
    ElrondArray,
    ElrondString,
    ElrondU32,
    ElrondU64,
    ElrondU8, ElrondVoid,
    ManagedAddress,
    Option, OptionalValue,
    TokenIdentifier
} from "@gfusee/elrond-wasm-as";

@callable
export abstract class LotteryEsdtContract extends CallableContract {

    abstract start(
        lotteryName: ElrondString,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ElrondU32>,
        optDeadline: Option<ElrondU64>,
        optMaxEntriesPerUser: Option<ElrondU32>,
        optPrizeDistribution: Option<ElrondArray<ElrondU8>>,
        optWhitelist: Option<ElrondArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): ContractCall<ElrondVoid>

}