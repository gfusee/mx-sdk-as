import {
    bigIntGetESDTExternalBalance,
    bigIntGetExternalBalance,
    getBlockEpoch,
    getBlockRound,
    getBlockNonce,
    getBlockTimestamp,
    getCaller,
    getESDTLocalRoles,
    getGasLeft,
    getOriginalTxHash,
    getOwnerAddress,
    getSCAddress, managedGetBlockRandomSeed, Static, isSmartContract
} from "../utils/env";
import {BigUint, ManagedBuffer, ManagedU64, ESDTLocalRole, ManagedAddress, TokenIdentifier} from "../types";

export class Blockchain {

    get currentBlockTimestamp(): ManagedU64 {
        const timestampRaw = getBlockTimestamp();
        return ManagedU64.fromValue(timestampRaw as u64);
    }

    get currentBlockRound(): ManagedU64 {
        const blockRoundRaw = getBlockRound()
        return ManagedU64.fromValue(blockRoundRaw as u64)
    }

    get currentBlockEpoch(): ManagedU64 {
        const blockEpochRaw = getBlockEpoch()
        return ManagedU64.fromValue(blockEpochRaw as u64)
    }

    get currentBlockNonce(): ManagedU64 {
        const blockNonceRaw = getBlockNonce()
        return ManagedU64.fromValue(blockNonceRaw as u64)
    }

    get currentBlockRandomSeed(): ManagedBuffer {
        const handle = Static.nextHandle()
        managedGetBlockRandomSeed(handle)
        return ManagedBuffer.fromHandle(handle)
    }

    get txHash(): ManagedBuffer {
        const txHashBytes = new Uint8Array(32)
        getOriginalTxHash(changetype<i32>(txHashBytes.buffer))

        return ManagedBuffer.dummy().utils.fromBytes(txHashBytes)
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

    getSCBalance(tokenIdentifier: TokenIdentifier, nonce: ManagedU64): BigUint {
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

    isSmartContract(
        address: ManagedAddress
    ): boolean {
        const addressBytes = address.utils.toBytes()

        return isSmartContract(
            changetype<i32>(addressBytes.buffer)
        ) > 0
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
        nonce: ManagedU64
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

    getGasLeft(): ManagedU64 {
        return ManagedU64.fromValue(getGasLeft() as u64)
    }

    assertCallerIsContractOwner(): void {
        if (this.caller != this.owner) {
            throw new Error('Endpoint can only be called by owner')
        }
    }

}
