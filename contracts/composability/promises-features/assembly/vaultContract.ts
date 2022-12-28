import {BigUint, CallableContract, ContractCall, ElrondU64, ElrondVoid, TokenIdentifier} from "@gfusee/elrond-wasm-as"

@callable
export abstract class VaultContract extends CallableContract {

    abstract acceptFunds(): ContractCall<ElrondVoid>

    abstract retrieveFunds(
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint
    ): ContractCall<ElrondVoid>

}
