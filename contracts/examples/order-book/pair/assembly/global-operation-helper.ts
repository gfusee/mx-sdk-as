//@ts-nocheck
import {
    ContractBase,
    ManagedBoolean
} from "@gfusee/mx-sdk-as";
import {OrderInputParams} from "./common";

@module
export abstract class GlobalOperationModule extends ContractBase {

    globalOperationOngoing!: ManagedBoolean

    @onlyOwner
    startGlobalOperation(): void {
        this.requireGlobalOpNotOngoing()
        this.globalOperationOngoing = ManagedBoolean.true()
    }

    @onlyOwner
    stopGlobalOperation(): void {
        this.requireGlobalOpOngoing()
        this.globalOperationOngoing = ManagedBoolean.false()
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
