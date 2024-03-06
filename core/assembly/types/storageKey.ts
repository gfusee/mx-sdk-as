import {ManagedBuffer} from "./buffer";
import {BaseManagedType, ManagedType} from "./interfaces/managedType";
import {checkIfDebugBreakpointEnabled} from "../utils/env";

@unmanaged
export class StorageKey { //TODO : allocate on the stack

    constructor(
        public buffer: ManagedBuffer
    ) {}

    clone(): StorageKey {
        return new StorageKey(this.buffer.clone())
    }

    appendBuffer(buffer: ManagedBuffer): void {
        this.buffer.append(buffer)
    }

    appendItem<T extends BaseManagedType>(item: T): void {
        item.utils.encodeNested(this.buffer)
    }

}
