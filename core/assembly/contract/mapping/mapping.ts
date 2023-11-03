import {BigUint, ElrondString, ElrondU32, ElrondU64} from "../../types"
import { ManagedType } from "../../types"
import {checkIfDebugBreakpointEnabled, enableDebugBreakpoint, Static} from "../../utils/env"
import { BaseMapping } from "./baseMapping"

@unmanaged
export class Mapping<T extends ManagedType> extends BaseMapping { //TODO : Make all methods statics to avoid heap allocation

    get(): T {
        const buffer = (ElrondString.dummy()).utils.fromStorage(this.key.buffer);
        return buffer.utils.intoTop<T>()
    }

    set(value: T): void {
        value.utils.storeAtBuffer(this.key.buffer)
    }

    clear(): void {
        Static.EMPTY_BUFFER.utils.storeAtBuffer(this.key.buffer)
    }

    isEmpty(): boolean {
        return ElrondString.dummy().utils.fromStorage(this.key.buffer).isEmpty()
    }

}
