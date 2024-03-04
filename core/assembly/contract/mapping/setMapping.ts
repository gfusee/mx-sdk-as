import {ManagedType, ManagedBuffer, ManagedU32, BigUint, StorageKey} from "../../types";
import {
    __frameworkGetRetainedClosureValue, __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue,
    getRetainedClosureValue
} from "../../utils/env";
import { BaseMapping } from "./baseMapping";
import { Mapping } from "./mapping";
import {QueueMapping, QueueMappingIterator} from "./queueMapping";

const NULL_ENTRY: u32 = 0
const NODE_ID_IDENTIFIER: string = ".node_id"

@unmanaged
export class SetMapping<T extends ManagedType> extends BaseMapping {

    private queueMapping: QueueMapping<T>

    constructor(key: StorageKey) {
        super(key)

        this.queueMapping = new QueueMapping(key)
    }

    isEmpty(): bool {
        return this.queueMapping.isEmpty()
    }

    getLength(): ManagedU32 {
        return this.queueMapping.getLength()
    }

    includes(value: T): bool {
        return this.getNodeId(value) != ManagedU32.fromValue(NULL_ENTRY)
    }

    insert(value: T): bool {
        if (this.includes(value)) {
            return false
        }

        const newNodeId = this.queueMapping.pushBackNodeId(value)
        this.setNodeId(value, newNodeId)

        return true
    }

    remove(value: T): bool {
        const nodeId = this.getNodeId(value)
        if (nodeId.value == NULL_ENTRY) {
            return false
        }

        this.queueMapping.removeByNodeId(nodeId)
        this.clearNodeId(value)
        return true
    }

    clear(): void {
        __frameworkRetainClosureValue(this)
        this.queueMapping.forEach((item) => {
            const thisRef = __frameworkGetRetainedClosureValue<SetMapping<T>>()
            thisRef.clearNodeId(item)
            __frameworkRetainClosureValue(thisRef)
        })
        __frameworkReleaseRetainedClosureValue()

        this.queueMapping.clear()
    }

    forEach(action: (item: T) => void): void {
        this.queueMapping.forEach(action)
    }

    getIterator(): QueueMappingIterator<T> {
        return this.queueMapping.getIterator()
    }

    private getNodeId(value: T): ManagedU32 {
        const mapping = this.getNodeIdMapping(value)
        return mapping.get()
    }

    private setNodeId(value: T, nodeId: ManagedU32): void {
        const mapping = this.getNodeIdMapping(value)
        mapping.set(nodeId)
    }

    private clearNodeId(value: T): void {
        const mapping = this.getNodeIdMapping(value)
        mapping.clear()
    }

    private getNodeIdMapping(value: T): Mapping<ManagedU32> {
        const key = this.buildNamedValueKey(ManagedBuffer.fromString(NODE_ID_IDENTIFIER), value)
        return new Mapping<ManagedU32>(key)
    }

    private buildNamedValueKey(name: ManagedBuffer, value: T): StorageKey {
        const namedKey = this.key.clone()
        namedKey.appendBuffer(name)
        namedKey.appendItem(value)

        return namedKey
    }

}
