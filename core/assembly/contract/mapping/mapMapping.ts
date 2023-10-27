import {
    ManagedType,
    ElrondString,
    ElrondU32,
    Option,
    MultiValue,
    MultiValue2,
    BigUint,
    TokenIdentifier,
    ElrondU64, StorageKey
} from "../../types";
import {
    __frameworkGetRetainedClosureValue, __frameworkReleaseRetainedClosureValue,
    __frameworkRetainClosureValue,
    getRetainedClosureValue
} from "../../utils/env";
import { ContractBase, getContractInstance } from "../contractBase";
import { BaseMapping } from "./baseMapping";
import { Mapping } from "./mapping";
import { SetMapping } from "./setMapping";
import {QueueMapping, QueueMappingIterator} from "./queueMapping";

const MAPPED_VALUE_IDENTIFIER: string = ".mapped"

export class MapMapping<K extends MultiValue, V extends ManagedType> extends BaseMapping {

    private keysSet!: SetMapping<K>

    constructor(
        key: StorageKey
    ) {
        super(key)

        this.keysSet = new SetMapping(key)
    }

    isEmpty(): bool {
        return this.keysSet.isEmpty()
    }

    getLength(): ElrondU32 {
        return this.keysSet.getLength()
    }

    includesKey(key: K): bool {
        return this.keysSet.includes(key)
    }

    get(key: K): Option<V> {
        if (this.includesKey(key)) {
            return Option.withValue(this.getMappedValue(key))
        }

        return Option.null<V>()
    }

    insert(key: K, value: V): Option<V> {
        const oldValue = this.get(key)
        this.setMappedValue(key, value)
        this.keysSet.insert(key)
        return oldValue
    }

    remove(key: K): Option<V> {
        if (this.keysSet.remove(key)) {
            const value = this.getMappedValue(key)
            this.clearMappedValue(key)
            return Option.withValue(value)
        }

        return Option.null<V>()
    }

    entry(key: K): Entry<K, V> {
        if (this.includesKey(key)) {
            return new OccupiedEntry<K, V>(key, this)
        } else {
            return new VacantEntry<K, V>(key, this)
        }
    }

    clear(): void {
        __frameworkRetainClosureValue(this)
        this.keysSet.forEach((key) => {
            const thisRef = __frameworkGetRetainedClosureValue<MapMapping<K, V>>()
            const mapping = thisRef.getMappedValueMapping(key)

            mapping.clear()
            __frameworkRetainClosureValue(thisRef)
        })
        __frameworkReleaseRetainedClosureValue()
        this.keysSet.clear()
    }

    forEach(action: (key: K, item: V) => void): void {
        const iter = this.getIterator()

        let optCurrentItem = iter.next()
        while (!optCurrentItem.isNull()) {
            const currentItem = optCurrentItem.unwrap()
            action(currentItem.a, currentItem.b)
            optCurrentItem = iter.next()
        }
    }

    getKeysIterator(): QueueMappingIterator<K> {
        return this.keysSet.getIterator()
    }

    getIterator(): MapMappingIterator<K, V> {
        return new MapMappingIterator<K, V>(this)
    }

    private getMappedValue(key: K): V {
        const mapping = this.getMappedValueMapping(key)
        return mapping.get()
    }

    private setMappedValue(key: K, value: V): void {
        const mapping = this.getMappedValueMapping(key)
        mapping.set(value)
    }

    private clearMappedValue(key: K): void {
        const mapping = this.getMappedValueMapping(key)
        mapping.clear()
    }

    private getMappedValueMapping(key: K): Mapping<V> {
        const mappingKey = this.buildNamedKey(ElrondString.fromString(MAPPED_VALUE_IDENTIFIER), key)
        return new Mapping<V>(mappingKey)
    }

    private buildNamedKey(name: ElrondString, key: K): StorageKey {
        const namedKey = this.key.clone()
        namedKey.appendBuffer(name)
        namedKey.appendItem(key)

        return namedKey
    }

}

abstract class Entry<K extends MultiValue, V extends ManagedType> {

    constructor(
        protected key: K,
        protected map: MapMapping<K, V>
    ) {}

    orInsert(defaultValue: V): OccupiedEntry<K, V> {
        if (this.isOccupied()) {
            return this as OccupiedEntry<K, V>
        } else {
            return (this as VacantEntry<K, V>).insert(defaultValue)
        }
    }

    isOccupied(): bool {
        return this instanceof OccupiedEntry
    }

}

class OccupiedEntry<K extends MultiValue, V extends ManagedType> extends Entry<K, V> {

    get(): V {
        return this.map.get(this.key).unwrap()
    }

    removeEntry(): MultiValue2<K, V> {
        const value = this.map.remove(this.key)

        return MultiValue2.from(this.key, value)
    }

    update(transform: (item: V) => V): void {
        const value = this.get()
        const newValue = transform(value)
        this.map.insert(this.key, newValue)
    }

    insert(value: V): V {
        return this.map.insert(this.key, value).unwrap()
    }

    remove(): V {
        return this.map.remove(this.key).unwrap()
    }

}

class VacantEntry<K extends MultiValue, V extends ManagedType> extends Entry<K, V> {

    insert(value: V): OccupiedEntry<K, V> {
        this.map.insert(this.key, value)

        return new OccupiedEntry<K, V>(this.key, this.map)
    }

}

class MapMappingIterator<K extends MultiValue, V extends ManagedType> {

    private keys: QueueMappingIterator<K>

    constructor(
        private map: MapMapping<K, V>
    ) {
        this.keys = map.getKeysIterator()
    }

    next(): Option<MultiValue2<K, V>> {
        const currentKey = this.keys.next()
        if (currentKey.isNull()) {
            return Option.null<MultiValue2<K, V>>()
        }

        return Option.withValue(
            MultiValue2.from(
                currentKey.value!,
                this.map.get(currentKey.unwrap()).unwrap()
            )
        )
    }

}
