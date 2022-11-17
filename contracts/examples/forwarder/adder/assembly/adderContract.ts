//@ts-nocheck

import {BigUint, CallableContract, ContractCall, ElrondVoid} from "@gfusee/elrond-wasm-as";

@callable
export abstract class AdderContract extends CallableContract {

    abstract getSum(): ContractCall<BigUint>

    abstract add(value: BigUint): ContractCall<ElrondVoid>

}