import {ManagedBuffer, ManagedU32, ManagedType, StorageKey} from "../../types";
import {
    __frameworkGetRetainedClosureValue,
    __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue, checkIfDebugBreakpointEnabled,
    Static
} from "../../utils/env";
import {ArrayMapping} from "./arrayMapping";
import {BaseMapping} from "./baseMapping";

@unmanaged
export class UnorderedSetMapping<T extends ManagedType> extends BaseMapping {

    private static INDEX_SUFFIX: string = '.index'
    private static NULL_ENTRY: i32 = 0

    private arrayMapping!: ArrayMapping<T>

    constructor(key: StorageKey) {
        super(key)

        this.arrayMapping = new ArrayMapping(this.key)
    }

    getIndex(value: T): i32 {
        const result = ManagedU32.dummy().utils.fromStorage(this.getItemIndexKey(value))

        return result.value as i32
    }

    get(index: i32): T {
        return this.arrayMapping.get(index)
    }

    insert(value: T): bool {
        if (this.includes(value)) {
            return false
        }
        this.arrayMapping.push(value)
        this.setIndex(value, this.getLength() + ManagedU32.fromValue(1))

        return true
    }

    includes(value: T): bool {
        return this.getIndex(value) != UnorderedSetMapping.NULL_ENTRY
    }

    isEmpty(): bool {
        return this.arrayMapping.isEmpty()
    }

    clear(): void {
        __frameworkRetainClosureValue(this)
        this.arrayMapping.forEach((item, _) => {
            const thisRef = __frameworkGetRetainedClosureValue<UnorderedSetMapping<T>>()
            thisRef.clearIndex(item)
            __frameworkRetainClosureValue(thisRef)
        })
        __frameworkReleaseRetainedClosureValue()
        this.arrayMapping.clear()
    }

    forEach(action: (item: T) => void): void {
        this.arrayMapping.forEach(action)
    }

    getLength(): ManagedU32 {
        return this.arrayMapping.getLength()
    }

    private setIndex(value: T, index: ManagedU32): void {
        index.utils.storeAtBuffer(this.getItemIndexKey(value))
    }

    private clearIndex(value: T): void {
        Static.EMPTY_BUFFER.utils.storeAtBuffer(this.getItemIndexKey(value))
    }

    private getItemIndexKey(value: T): ManagedBuffer { //TODO : optimize by returning ManagedBuffer and no '.toString' use
        const result = this.key.clone()
        result.appendBuffer(ManagedBuffer.fromString(UnorderedSetMapping.INDEX_SUFFIX))
        result.appendItem(value)
        return result.buffer
    }

    @operator("[]")
    __get(index: i32): T {
        return this.get(index)
    }

}
