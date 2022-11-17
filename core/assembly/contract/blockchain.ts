import {
    bigIntGetESDTExternalBalance,
    bigIntGetExternalBalance,
    getBlockEpoch,
    getBlockRound,
    getBlockTimestamp,
    getCaller,
    getESDTLocalRoles,
    getGasLeft,
    getOriginalTxHash,
    getOwnerAddress,
    getSCAddress, managedGetBlockRandomSeed, Static
} from "../utils/env";
import {BigUint, ElrondString, ElrondU64, ESDTLocalRole, ManagedAddress, TokenIdentifier} from "../types";

export class Blockchain {

    get currentBlockTimestamp(): ElrondU64 {
        const timestampRaw = getBlockTimestamp();
        return ElrondU64.fromValue(timestampRaw as u64);
    }

    get currentBlockRound(): ElrondU64 {
        const blockRoundRaw = getBlockRound()
        return ElrondU64.fromValue(blockRoundRaw as u64)
    }

    get currentBlockEpoch(): ElrondU64 {
        const blockEpochRaw = getBlockEpoch()
        return ElrondU64.fromValue(blockEpochRaw as u64)
    }

    get currentBlockRandomSeed(): ElrondString {
        const handle = Static.nextHandle()
        managedGetBlockRandomSeed(handle)
        return ElrondString.fromHandle(handle)
    }

    get txHash(): ElrondString {
        const txHashBytes = new Uint8Array(32)
        getOriginalTxHash(changetype<i32>(txHashBytes.buffer))

        return ElrondString.dummy().utils.fromBytes(txHashBytes)
    }

    get caller(): ManagedAddress {
        const bytes = new Uint8Array(32)
        getCaller(changetype<i32>(bytes.buffer))

        return ManagedAddress.dummy().utils.fromBytes(bytes)
    }

    get scAddress(): ManagedAddress {
        const addressBytes = new Uint8Array(ManagedAddress.ADDRESS_BYTES_LEN)
        getSCAddress(changetype<i32>(addressBytes.buffer))
        return ManagedAddress.dummy().utils.fromBytes(addressBytes)
    }

    get owner(): ManagedAddress {
        const addressBytes = new Uint8Array(ManagedAddress.ADDRESS_BYTES_LEN)
        getOwnerAddress(changetype<i32>(addressBytes.buffer))
        return ManagedAddress.dummy().utils.fromBytes(addressBytes)
    }

    getSCBalance(tokenIdentifier: TokenIdentifier, nonce: ElrondU64): BigUint {
        if (tokenIdentifier.isEgld()) {
            return this.getEGLDBalance(
                this.scAddress
            )
        } else {
            return this.getESDTBalance(
                this.scAddress,
                tokenIdentifier,
                nonce
            )
        }
        
    }

    getEGLDBalance(
        address: ManagedAddress
    ): BigUint {
        const result = BigUint.zero()

        const addressBytes = address.utils.toBytes()

        bigIntGetExternalBalance(
            changetype<i32>(addressBytes.buffer),
            result.getHandle()
        )

        return result
    }

    getESDTBalance(
        address: ManagedAddress,
        tokenIdentifier: TokenIdentifier,
        nonce: ElrondU64
    ): BigUint {
        const result = BigUint.zero()

        const addressBytes = address.utils.toBytes()
        const tokenBytes = tokenIdentifier.utils.toBytes()

        bigIntGetESDTExternalBalance(
            changetype<i32>(addressBytes.buffer),
            changetype<i32>(tokenBytes.buffer),
            tokenBytes.byteLength,
            nonce.value as i64,
            result.getHandle()
        )

        return result
    }

    getESDTLocalRoles(tokenIdentifier: TokenIdentifier): ESDTLocalRole {
        return new ESDTLocalRole(getESDTLocalRoles(tokenIdentifier.getHandle()))
    }

    getGasLeft(): ElrondU64 {
        return ElrondU64.fromValue(getGasLeft() as u64)
    }

    assertCallerIsContractOwner(): void {
        if (this.caller != this.owner) {
            throw new Error('Endpoint can only be called by owner')
        }
    }

}