//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ManagedAddress,
    ElrondArray,
    ElrondString,
    ElrondU32,
    ElrondU64,
    ElrondU8,
    Option,
    OptionalValue,
    TokenIdentifier
} from "@gfusee/elrond-wasm-as";
import {LotteryEsdtContract} from "./lotteryEsdtContract";

@contract
abstract class CallerContract extends ContractBase {

    public address: ManagedAddress

    constructor(
        address: ManagedAddress
    ) {
        super()

        this.address = address
    }

    forwardStart(
        lotteryName: ElrondString,
        tokenIdentifier: TokenIdentifier,
        ticketPrice: BigUint,
        optTotalTickets: Option<ElrondU32>,
        optDeadline: Option<ElrondU64>,
        optMaxEntriesPerUser: Option<ElrondU32>,
        optPrizeDistribution: Option<ElrondArray<ElrondU8>>,
        optWhitelist: Option<ElrondArray<ManagedAddress>>,
        optBurnPercentage: OptionalValue<BigUint>
    ): void {
        const contract = new LotteryEsdtContract(this.address)

        contract.start(
            lotteryName,
            tokenIdentifier,
            ticketPrice,
            optTotalTickets,
            optDeadline,
            optMaxEntriesPerUser,
            optPrizeDistribution,
            optWhitelist,
            optBurnPercentage
        ).call()
    }

}