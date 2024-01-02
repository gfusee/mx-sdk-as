import {BaseMapping} from "./baseMapping";
import {ElrondArray, ElrondString, ElrondU32, ManagedAddress, Option, StorageKey} from "../../types";
import {Mapping} from "./mapping";

const ADDRESS_TO_ID_SUFFIX = "_address_to_id"
const ID_TO_ADDRESS_SUFFIX = "_id_to_address"
const COUNT_SUFFIX = "_count";

@unmanaged
export class UserMapping extends BaseMapping {

    private getUserIdKey(
        address: ManagedAddress
    ): ElrondString {
        const userIdKey = this.key.clone()
        userIdKey.appendBuffer(ElrondString.fromString(ADDRESS_TO_ID_SUFFIX))
        userIdKey.appendItem(address)

        const result = userIdKey.buffer

        heap.free(changetype<i32>(userIdKey))

        return result
    }

    private getUserAddressKey(
        id: ElrondU32
    ): ElrondString {
        const userAddressKey = this.key.clone()
        userAddressKey.appendBuffer(ElrondString.fromString(ID_TO_ADDRESS_SUFFIX))
        userAddressKey.appendItem(id)

        const result = userAddressKey.buffer

        heap.free(changetype<i32>(userAddressKey))

        return result
    }

    private getUserCountKey(): ElrondString {
        const userCountKey = this.key.clone()
        userCountKey.appendBuffer(ElrondString.fromString(COUNT_SUFFIX))

        const result = userCountKey.buffer

        heap.free(changetype<i32>(userCountKey))

        return result
    }

    getUserId(
        address: ManagedAddress
    ): ElrondU32 {
        const storageKey = new StorageKey(this.getUserIdKey(address))
        const mapping = new Mapping<ElrondU32>(storageKey)
        const result = mapping.get()

        heap.free(changetype<i32>(storageKey))
        heap.free(changetype<i32>(mapping))

        return result
    }

    private setUserId(
        address: ManagedAddress,
        id: ElrondU32
    ): void {
        const key = new StorageKey(this.getUserIdKey(address))
        const mapping = new Mapping<ElrondU32>(key)
        mapping.set(id)

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))
    }

    getUserAddress(
        id: ElrondU32
    ): Option<ManagedAddress> {
        const key = new StorageKey(this.getUserAddressKey(id))

        const mapping = new Mapping<ManagedAddress>(key)
        let result: Option<ManagedAddress>
        if (mapping.isEmpty()) {
            result = Option.null<ManagedAddress>()
        } else {
            result = Option.withValue<ManagedAddress>(mapping.get())
        }

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))

        return result
    }

    getUserAddressUnchecked(
        id: ElrondU32
    ): Option<ManagedAddress> {
        const key = new StorageKey(this.getUserAddressKey(id))

        const mapping = new Mapping<ManagedAddress>(key)
        const result = Option.withValue<ManagedAddress>(mapping.get())

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))

        return result
    }

    getUserAddressOrZero(
        id: ElrondU32
    ): ManagedAddress {
        const key = new StorageKey(this.getUserAddressKey(id))

        const mapping = new Mapping<ManagedAddress>(key)
        let result: ManagedAddress
        if (mapping.isEmpty()) {
            result = ManagedAddress.zero()
        } else {
            result = mapping.get()
        }

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))

        return result
    }

    private setUserAddress(
        id: ElrondU32,
        address: ManagedAddress
    ): void {
        const key = new StorageKey(this.getUserAddressKey(id))

        const mapping = new Mapping<ManagedAddress>(key)

        mapping.set(address)

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))
    }

    getUserCount(): ElrondU32 {
        const key = new StorageKey(this.getUserCountKey())
        const mapping = new Mapping<ElrondU32>(key)
        const result = mapping.get()

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))

        return result
    }

    private setUserCount(
        userCount: ElrondU32
    ): void {
        const key = new StorageKey(this.getUserCountKey())
        const mapping = new Mapping<ElrondU32>(key)
        mapping.set(userCount)

        heap.free(changetype<i32>(key))
        heap.free(changetype<i32>(mapping))
    }

    getOrCreateUser(
        address: ManagedAddress
    ): ElrondU32 {
        let userId = this.getUserId(address)

        if (userId == ElrondU32.zero()) {
            let userCount = this.getUserCount()
            userCount += ElrondU32.fromValue(1)
            this.setUserCount(userCount)
            userId = userCount
            this.setUserId(address, userId)
            this.setUserAddress(userId, address)
        }

        return userId
    }

    getAllAddresses(): ElrondArray<ManagedAddress> {
        const userCount = this.getUserCount()
        const result = ElrondArray.new<ManagedAddress>()
        for (let i = ElrondU32.fromValue(1); i <= userCount; i++) {
            result.push(this.getUserAddressOrZero(i))
        }

        return result
    }

}
