//@ts-nocheck

import {
    BigUint,
    ContractBase, ElrondArray, ElrondString, ElrondU32, ElrondU64
} from "@gfusee/elrond-wasm-as";

@contract
abstract class Adder extends ContractBase {

    sum!: BigUint

    constructor(
        initialValue: BigUint
    ) {
        this.sum = initialValue
    }

    add(value: BigUint): void {
        this.sum += value
    }

    getSum(): BigUint {
        return this.sum
    }

}