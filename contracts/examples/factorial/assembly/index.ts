//@ts-nocheck

import {
    ContractBase, BigUint
} from "@gfusee/elrond-wasm-as";

@contract
abstract class Factorial extends ContractBase {

    factorial(value: BigUint): BigUint {
        const one = BigUint.fromU64(1)


        if (value == BigUint.zero()) {
            return one
        }

        let result = BigUint.fromU64(1)
        let x = BigUint.fromU64(1)

        while (x <= value) {
            result *= x

            x += one
        }

        return result
    }

}