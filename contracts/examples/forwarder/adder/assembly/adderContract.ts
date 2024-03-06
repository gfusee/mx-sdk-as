//@ts-nocheck

import {BigUint, CallableContract, ContractCall, ManagedVoid} from "@gfusee/mx-sdk-as";

@callable
export abstract class AdderContract extends CallableContract {

    abstract getSum(): ContractCall<BigUint>

    abstract add(value: BigUint): ContractCall<ManagedVoid>

}
