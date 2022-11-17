//@ts-nocheck
import {
    ContractBase,
    ElrondBoolean
} from "@gfusee/elrond-wasm-as";
import {OrderInputParams} from "./common";

@module
export abstract class GlobalOperationModule extends ContractBase {

    globalOperationOngoing!: ElrondBoolean

    startGlobalOperation(): void {
        this.requireGlobalOpNotOngoing()
        this.globalOperationOngoing = ElrondBoolean.true()
    }

    stopGlobalOperation(): void {
        this.requireGlobalOpOngoing()
        this.globalOperationOngoing = ElrondBoolean.false()
    }

    protected requireGlobalOpOngoing(): void {
        this.require(
            this.globalOperationOngoing.value,
            "Global operation ongoing"
        )
    }

    protected requireGlobalOpNotOngoing(): void {
        this.require(
            !this.globalOperationOngoing.value,
            "Global operation not ongoing"
        )
    }

}