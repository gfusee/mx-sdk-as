import {ManagedU32, StorageKey} from "../../types";
import {ManagedBuffer} from "../../types/buffer";
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
            lenKey.appendBuffer(ManagedBuffer.fromString(ArrayMapping.LEN_SUFFIX))

            this._lenKeyCache = lenKey

            return lenKey
        }
    }

    get(index: ManagedU32): T {
        const result = ManagedBuffer.dummy().utils.fromStorage(this.getItemKey(index))

        return result.utils.intoTop<T>()
    }

    push(value: T): void {
        const newLength = this.getLength() + ManagedU32.fromValue(1)
        this.set(newLength, value)

        this.saveCount(newLength)
    }

    set(index: ManagedU32, value: T): void {
        value.utils.storeAtBuffer(this.getItemKey(index))
    }

    clear(): void {
        const length = this.getLength()
        for (let i = ManagedU32.fromValue(1); i <= length; i++) {
            const itemKey = this.getItemKey(i)
            Static.EMPTY_BUFFER.utils.storeAtBuffer(itemKey)
        }

        this.saveCount(ManagedU32.zero())
    }

    forEach(action: (item: T, index: ManagedU32) => void): void {
        const length = this.getLength()

        if (length == ManagedU32.zero()) {
            return
        }

        for (let i = ManagedU32.fromValue(1); i <= length; i++) {
            const item = this.get(i)
            action(item, i)
        }
    }

    getLength(): ManagedU32 {
        return ManagedU32.dummy().utils.fromStorage(this.lenKey.buffer)
    }

    isEmpty(): bool {
        return this.getLength() == ManagedU32.zero()
    }

    private getItemKey(index: ManagedU32): ManagedBuffer { //TODO : optimize by returning ManagedBuffer and no '.toString' use
        const result = this.key.clone()
        result.appendBuffer(ManagedBuffer.fromString(ArrayMapping.ITEM_SUFFIX))
        result.appendItem(index)

        return result.buffer
    }

    private saveCount(newLength: ManagedU32): void {
        newLength.utils.storeAtBuffer(this.lenKey.buffer)
    }

    @operator("[]")
    __get(index: i32): T {
        return this.get(index)
    }

}
