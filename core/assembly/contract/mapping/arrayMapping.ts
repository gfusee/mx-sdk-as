import {ElrondU32, StorageKey} from "../../types";
import {ElrondString} from "../../types/erdString";
import {ManagedType} from "../../types/interfaces/managedType";
import {Static} from "../../utils/env";
import {BaseMapping} from "./baseMapping";

@unmanaged
export class ArrayMapping<T extends ManagedType> extends BaseMapping {

    private static ITEM_SUFFIX: string = '.item'
    private static LEN_SUFFIX: string = '.len'

    private _lenKeyCache: StorageKey | null = null

    private get lenKey(): StorageKey {
        if (this._lenKeyCache !== null) {
            return this._lenKeyCache!
        } else {
            const lenKey = this.key.clone()
            lenKey.appendBuffer(ElrondString.fromString(ArrayMapping.LEN_SUFFIX))

            this._lenKeyCache = lenKey

            return lenKey
        }
    }

    get(index: ElrondU32): T {
        const result = ElrondString.dummy().utils.fromStorage(this.getItemKey(index))

        return result.utils.intoTop<T>()
    }

    push(value: T): void {
        const newLength = this.getLength() + ElrondU32.fromValue(1)
        this.set(newLength, value)

        this.saveCount(newLength)
    }

    set(index: ElrondU32, value: T): void {
        value.utils.storeAtBuffer(this.getItemKey(index))
    }

    clear(): void {
        const length = this.getLength()
        for (let i = ElrondU32.fromValue(1); i <= length; i++) {
            const itemKey = this.getItemKey(i)
            Static.EMPTY_BUFFER.utils.storeAtBuffer(itemKey)
        }

        this.saveCount(ElrondU32.zero())
    }

    forEach(action: (item: T, index: ElrondU32) => void): void {
        const length = this.getLength()

        if (length == ElrondU32.zero()) {
            return
        }

        for (let i = ElrondU32.fromValue(1); i <= length; i++) {
            const item = this.get(i)
            action(item, i)
        }
    }

    getLength(): ElrondU32 {
        return ElrondU32.dummy().utils.fromStorage(this.lenKey.buffer)
    }

    isEmpty(): bool {
        return this.getLength() == ElrondU32.zero()
    }

    private getItemKey(index: ElrondU32): ElrondString { //TODO : optimize by returning ElrondString and no '.toString' use
        const result = this.key.clone()
        result.appendBuffer(ElrondString.fromString(ArrayMapping.ITEM_SUFFIX))
        result.appendItem(index)

        return result.buffer
    }

    private saveCount(newLength: ElrondU32): void {
        newLength.utils.storeAtBuffer(this.lenKey.buffer)
    }

    @operator("[]")
    __get(index: i32): T {
        return this.get(index)
    }

}
