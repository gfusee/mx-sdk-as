//@ts-nocheck

import {
    BigUint,
    ContractBase,
    ManagedAddress,
    ManagedArray,
    ManagedBuffer,
    ManagedU32,
    ManagedU64,
    ManagedU8,
    Option,
    OptionalValue,
    TokenIdentifier
} from "@gfusee/mx-sdk-as";
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
