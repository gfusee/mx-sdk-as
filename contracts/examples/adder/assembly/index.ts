//@ts-nocheck

import {
    BigUint,
    ContractBase
} from "@gfusee/mx-sdk-as";

@contract
abstract class Adder extends ContractBase {

    sum!: BigUint

    constructor(initialValue: BigUint) {
        this.sum = initialValue
    }

    @view
    getSum(): BigUint {
        return this.sum
    }

    add(value: BigUint): void {
        this.sum += value
    }

}
