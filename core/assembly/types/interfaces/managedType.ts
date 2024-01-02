import {IManagedUtils} from "./managedUtils";
import {ElrondU32} from "../numbers";
import {NestedEncodeOutput} from "./nestedEncodeOutput";
import {checkIfDebugBreakpointEnabled} from "../../utils/env";

const NESTED_ENCODE_OUTPUT_NOT_IMPLEMENTED = "NestedEncodeOutput not implemented for this type"

export function defaultBaseManagedTypeWriteImplementation(): void {
    throw new Error(NESTED_ENCODE_OUTPUT_NOT_IMPLEMENTED)
}

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

    abstract skipsReserialization(): boolean

    abstract get payloadSize(): ElrondU32

    abstract get shouldBeInstantiatedOnHeap(): boolean

    abstract write(bytes: Uint8Array): void
}

@unmanaged
export abstract class ManagedType extends BaseManagedType {
    constructor() {
        super()
        throw new Error("Please use static method.")
    }
}
