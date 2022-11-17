import {IManagedUtils} from "./managedUtils";
import {ElrondU32} from "../numbers";
import {NestedEncodeOutput} from "./nestedEncodeOutput";
import {checkIfDebugBreakpointEnabled} from "../../utils/env";

@unmanaged
export abstract class BaseManagedType extends NestedEncodeOutput {

    static dummy<T extends BaseManagedType>(): T {
        const dummy = changetype<T>(0)
        if (dummy.shouldBeInstantiatedOnHeap) {
            return instantiate<T>()
        }
        return dummy
    }

    abstract get utils(): IManagedUtils

    abstract getHandle(): i32

    instantiateDefaults(): void {
        throw new Error("instantiate defaults not implemented")
    }

    get canDecodeDefaults(): boolean {
        return false
    }

    get skipsReserialization(): boolean {
        return false
    }

    abstract get payloadSize(): ElrondU32

    abstract get shouldBeInstantiatedOnHeap(): boolean

    write(bytes: Uint8Array): void {
        throw new Error("NestedEncodeOutput not implemented for this type")
    }
}

@unmanaged
export abstract class ManagedType extends BaseManagedType {
    constructor() {
        super()
        throw new Error("Please use static method.")
    }
}