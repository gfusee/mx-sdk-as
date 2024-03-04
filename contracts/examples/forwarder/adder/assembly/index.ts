//@ts-nocheck

import {
    BigUint,
    ContractBase, ManagedAddress
} from "@gfusee/mx-sdk-as";
import {AdderContract} from "./adderContract";

@contract
abstract class CallerContract extends ContractBase {

    public address: ManagedAddress

    constructor(
        address: ManagedAddress
    ) {
        super()

        this.address = address
    }

    forwardAdd(value: BigUint): void {
        let contract = new AdderContract(this.address)

        contract.add(value).call()
    }

    forwardGetSum(): BigUint {
        let contract = new AdderContract(this.address)

        return contract.getSum().call()
    }

}
