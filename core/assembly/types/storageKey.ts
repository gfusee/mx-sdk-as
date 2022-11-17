import {ElrondString} from "./erdString";
import {BaseManagedType, ManagedType} from "./interfaces/managedType";
import {checkIfDebugBreakpointEnabled} from "../utils/env";

export class StorageKey { //TODO : allocate on the stack

    constructor(
        public buffer: ElrondString
    ) {}

    clone(): StorageKey {
        return new StorageKey(this.buffer.clone())
    }

    appendBuffer(buffer: ElrondString): void {
        this.buffer.append(buffer)
    }

    appendItem<T extends BaseManagedType>(item: T): void {
        item.utils.encodeNested(this.buffer)
    }

}