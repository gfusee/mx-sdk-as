import {ManagedType, ElrondString, ElrondU32, Option, StorageKey} from "../../types";
import { BaseMapping } from "./baseMapping";
import { Mapping } from "./mapping";

const INFO_IDENTIFIER: string = '.info'
const NODE_IDENTIFIER: string = '.node_links'
const VALUE_IDENTIFIER: string = '.value'
const NULL_ENTRY: u32 = 0

@unmanaged
export class QueueMapping<T extends ManagedType> extends BaseMapping {

    private infoMapping!: Mapping<QueueMappingInfo>

    constructor(
        key: StorageKey
    ) {
        super(key)

        const infoKey = this.buildNameKey(ElrondString.fromString(INFO_IDENTIFIER))
        this.infoMapping = (new Mapping<QueueMappingInfo>(infoKey))
    }

    isEmpty(): bool {
        return this.getInfo().length.value == 0
    }

    getLength(): ElrondU32 {
        return this.getInfo().length
    }

    pushBackNodeId(elt: T): ElrondU32 {
        const info = this.getInfo()
        const newNodeId = info.generateNewNodeId()
        let previous = ElrondU32.fromValue(NULL_ENTRY)
        if (info.length.value == 0) {
            info.front = newNodeId
        } else {
            const back = info.back
            const backNode = this.getNode(back)
            backNode.next = newNodeId
            previous = back
            this.setNode(back, backNode)
        }

        this.setNode(
            newNodeId,
            QueueMappingNode.new(
                previous,
                ElrondU32.fromValue(NULL_ENTRY)
            )
        )

        info.back = newNodeId
        this.setValue(newNodeId, elt)
        info.length += ElrondU32.fromValue(1)
        this.setInfo(info)
        return newNodeId
    }

    removeByNodeId(nodeId: ElrondU32): Option<T> {
        if (nodeId.value == NULL_ENTRY) {
            return Option.null<T>()
        }

        const node = this.getNode(nodeId)

        const info = this.getInfo()
        if (node.previous.value == NULL_ENTRY) {
            info.front = node.next
        } else {
            const previous = this.getNode(node.previous)
            previous.next = node.next
            this.setNode(node.previous, previous)
        }

        if (node.next.value == NULL_ENTRY) {
            info.back = node.previous
        } else {
            const next = this.getNode(node.next)
            next.previous = node.previous
            this.setNode(node.next, next)
        }

        this.clearNode(nodeId)
        const removedValue = this.getValue(nodeId)
        this.clearValue(nodeId)
        info.length -= ElrondU32.fromValue(1)
        this.setInfo(info)
        return Option.withValue(removedValue)
    }

    forEach(action: (item: T) => void): void {
        const iter = this.getIterator()

        let optCurrentItem = iter.next()
        while (!optCurrentItem.isNull()) {
            const currentItem = optCurrentItem.unwrap()
            action(currentItem)
            optCurrentItem = iter.next()
        }
    }

    clear(): void {
        const info = this.getInfo()
        let nodeId = info.front
        while (nodeId != ElrondU32.fromValue(NULL_ENTRY)) {
            const node = this.getNode(nodeId)
            const nodeMapping = this.getNodeMapping(nodeId)
            nodeMapping.clear()

            const valueMapping = this.getValueMapping(nodeId)
            valueMapping.clear()

            nodeId = node.next
        }
        this.clearInfo()
    }

    getValue(nodeId: ElrondU32): T {
        const mapping = this.getValueMapping(nodeId)
        return mapping.get()
    }

    getIterator(): QueueMappingIterator<T> {
        return new QueueMappingIterator<T>(this)
    }

    private setValue(nodeId: ElrondU32, value: T): void {
        const mapping = this.getValueMapping(nodeId)
        mapping.set(value)
    }

    private clearValue(nodeId: ElrondU32): void {
        const mapping = this.getValueMapping(nodeId)
        mapping.clear()
    }

    getInfo(): QueueMappingInfo {
        return this.infoMapping.get()
    }

    private clearInfo(): void {
        this.infoMapping.clear()
    }

    private setInfo(value: QueueMappingInfo): void {
        return this.infoMapping.set(value)
    }

    getNode(nodeId: ElrondU32): QueueMappingNode {
        const nodeMapping = this.getNodeMapping(nodeId)

        return nodeMapping.get()
    }

    private setNode(nodeId: ElrondU32, item: QueueMappingNode): void {
        const nodeMapping = this.getNodeMapping(nodeId)
        nodeMapping.set(item)
    }

    private clearNode(nodeId: ElrondU32): void {
        const nodeMapping = this.getNodeMapping(nodeId)
        nodeMapping.clear()
    }

    private buildNameKey(name: ElrondString): StorageKey {
        const nameKey = this.key.clone()
        nameKey.appendBuffer(name)

        return nameKey
    }

    private getNodeMapping(nodeId: ElrondU32): Mapping<QueueMappingNode> {
        const key = this.buildNodeIdNamedKey(ElrondString.fromString(NODE_IDENTIFIER), nodeId)
        return new Mapping<QueueMappingNode>(key)
    }

    private getValueMapping(nodeId: ElrondU32): Mapping<T> {
        const key = this.buildNodeIdNamedKey(ElrondString.fromString(VALUE_IDENTIFIER), nodeId)
        return new Mapping<T>(key)
    }

    private buildNodeIdNamedKey(name: ElrondString, nodeId: ElrondU32): StorageKey {
        const namedKey = this.key.clone()
        namedKey.appendBuffer(name)
        namedKey.appendItem(nodeId)

        return namedKey
    }

}

@struct
@defaultDecode
export class QueueMappingInfo {
    length!: ElrondU32
    front!: ElrondU32
    back!: ElrondU32
    newItem!: ElrondU32

    generateNewNodeId(): ElrondU32 {
        this.newItem += ElrondU32.fromValue(1)
        return this.newItem
    }

    topDecodeInstantiateDefaultsValues(): void {
        this.length = ElrondU32.zero()
        this.front = ElrondU32.zero()
        this.back = ElrondU32.zero()
        this.newItem = ElrondU32.zero()
    }
}

@struct
export class QueueMappingNode {
    previous!: ElrondU32
    next!: ElrondU32

    static new(
        previous: ElrondU32,
        next: ElrondU32
    ): QueueMappingNode {
        const result = new QueueMappingNode()
        result.previous = previous
        result.next = next

        return result
    }
}

export class QueueMappingIterator<T extends ManagedType> {

    private nodeId: ElrondU32

    constructor(
        private queue: QueueMapping<T>
    ) {
        this.nodeId = queue.getInfo().front
    }

    next(): Option<T> {
        const currentNodeId = this.nodeId
        if (currentNodeId.value == NULL_ENTRY) {
            return Option.null<T>()
        }

        this.nodeId = this.queue.getNode(currentNodeId).next
        return Option.withValue(this.queue.getValue(currentNodeId))
    }

}
