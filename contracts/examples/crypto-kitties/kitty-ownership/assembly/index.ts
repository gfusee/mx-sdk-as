//@ts-nocheck

import { Kitty } from '../../common/kitty/assembly/index'
import { KittyGenes } from '../../common/kitty/assembly/kittyGenes'
import { Random } from '../../common/random/assembly/index'
import {
    BigUint,
    ContractBase, ElrondEvent, ElrondString,
    ElrondU16,
    ElrondU32,
    ElrondU8, enableDebugBreakpoint,
    ManagedAddress,
    Mapping, MultiValue3,
    OptionalValue
} from "@gfusee/elrond-wasm-as";

class TransferEvent extends ElrondEvent<MultiValue3<ManagedAddress, ManagedAddress, ElrondU32>, ElrondString> {} //TODO : ElrondVoid ?

@contract
abstract class KittyOwnership extends ContractBase {

    constructor(
        birthFee: BigUint,
        optGeneScienceContractAddress: OptionalValue<ManagedAddress>,
        optKittyAuctionContractAddress: OptionalValue<ManagedAddress>
    ) {
        super();


        this.birthFee().set(birthFee)

        let geneScienceContractAddress = optGeneScienceContractAddress.value
        if (geneScienceContractAddress) {
            this.geneScienceContractAddress().set(geneScienceContractAddress!)
        }

        let kittyAuctionContractAddress = optKittyAuctionContractAddress.value
        if (kittyAuctionContractAddress) {
            this.kittyAuctionContractAddress().set(kittyAuctionContractAddress!)
        }

        this.createGenesisKitty()
    }

    approveSiring(
        address: ManagedAddress,
        kittyId: ElrondU32
    ): void {
        this.require(
            this.isValidId(kittyId),
            "Invalid kitty id!"
        )

        this.require(
            this.owner(kittyId).get() == this.blockchain.caller,
            "You are not the owner of the kitty!"
        )

        this.require(
            this.getSireAllowedAddressOrDefault(kittyId).isZero(),
            "Can't overwrite approved sire address!"
        )


        this.sireAllowedAddress(kittyId).set(address)
    }

    breedWith(
        matronId: ElrondU32,
        sireId: ElrondU32
    ): void {
        this.require(
            this.isValidId(matronId),
            "Invalid matring id!"
        )

        this.require(
            this.isValidId(sireId),
            "Invalid sire id!"
        )

        const payment = this.callValue.egldValue
        const autoBirthFee = this.birthFee().get()
        const caller = this.blockchain.caller

        this.require(
            payment == autoBirthFee,
            "Wrong fee!"
        )

        this.require(
            caller == this.owner(matronId).get(),
            "Only the owner of the matron can call this function!"
        )

        this.require(
            this.isSiringPermitted(
                matronId,
                sireId
            ),
            "Siring not permitted!"
        )

        const matron = this.kitty(matronId).get()
        const sire = this.kitty(sireId).get()

        this.require(
            this.isKittyReadyToBread(matron),
            "Matrib bit ready to breed!"
        )

        this.require(
            this.isKittyReadyToBread(sire),
            "Sire not ready to breed!"
        )

        this.require(
            this.isValidMatingPair(
                matronId,
                sireId
            ),
            "Not a valid mating pair!"
        )

        this.breed(
            matronId,
            sireId
        )
    }

    private createGenesisKitty(): void {
        const genesisKitty = Kitty.default()

        this.createNewKitty(
            genesisKitty.matronId,
            genesisKitty.sireId,
            genesisKitty.generation,
            genesisKitty.genes,
            ManagedAddress.zero()
        )
    }

    private createNewKitty(
        matronId: ElrondU32,
        sireId: ElrondU32,
        generation: ElrondU16,
        genes: KittyGenes,
        owner: ManagedAddress
    ): ElrondU32 {
        let totalKitties = this.totalKitties().get()
        const newKittyId = totalKitties
        const kitty = Kitty.new(
            genes,
            this.blockchain.currentBlockTimestamp,
            matronId,
            sireId,
            generation
        )

        totalKitties += ElrondU32.fromValue(1)
        this.totalKitties().set(totalKitties)
        this.kitty(newKittyId).set(kitty)

        this.performTransfer(
            ManagedAddress.zero(),
            owner,
            newKittyId
        )

        return newKittyId
    }

    private performTransfer(
        from: ManagedAddress,
        to: ManagedAddress,
        kittyId: ElrondU32
    ): void {
        if (from == to) {
            return
        }

        let numberOwnedTo = this.numberOwnedKitties(to).get()
        numberOwnedTo += ElrondU32.fromValue(1)

        if (!from.isZero()) {
            let numberOwnedFrom = this.numberOwnedKitties(from).get()
            numberOwnedFrom -= ElrondU32.fromValue(1)

            this.numberOwnedKitties(from).set(numberOwnedFrom)
            this.sireAllowedAddress(kittyId).clear()
            this.approvedAddress(kittyId).clear()
        }

        this.numberOwnedKitties(to).set(numberOwnedTo)
        this.owner(kittyId).set(to)

        this.transferEvent(
            from,
            to,
            kittyId
        )
    }

    private breed(
        matronId: ElrondU32,
        sireId: ElrondU32
    ): void {
        const matron = this.kitty(matronId).get()
        const sire = this.kitty(sireId).get()

        matron.siringWithId = sireId

        this.triggerCooldown(matron)
        this.triggerCooldown(sire)

        this.sireAllowedAddress(matronId).clear()
        this.sireAllowedAddress(sireId).clear()

        this.kitty(matronId).set(matron)
        this.kitty(sireId).set(sire)
    }

    private triggerCooldown(kitty: Kitty): void {
        const cooldown = kitty.getNextCooldownTime()
        kitty.cooldownEnd = this.blockchain.currentBlockTimestamp + cooldown
    }

    private isValidId(
        kittyId: ElrondU32
    ): boolean {
        return kittyId != ElrondU32.zero() && kittyId < this.totalKitties().get()
    }

    private isSiringPermitted(
        matronId: ElrondU32,
        sireId: ElrondU32
    ): boolean {
        const sireOwner = this.owner(sireId).get()
        const matronOwner = this.owner(matronId).get()
        const sireApprovedAddress = this.getSireAllowedAddressOrDefault(sireId)

        return sireOwner == matronOwner || matronOwner == sireApprovedAddress
    }

    private isKittyReadyToBread(kitty: Kitty): boolean {
        return kitty.siringWithId == ElrondU32.zero() && kitty.cooldownEnd < this.blockchain.currentBlockTimestamp
    }

    private isValidMatingPair(
        matronId: ElrondU32,
        sireId: ElrondU32
    ): boolean {
        const matron = this.kitty(matronId).get()
        const sire = this.kitty(sireId).get()

        // can't breed with itself
        if (matronId == sireId) {
            return false;
        }

        // can't breed with their parents
        if (matron.matronId == sireId || matron.sireId == sireId) {
            return false;
        }
        if (sire.matronId == matronId || sire.sireId == matronId) {
            return false;
        }

        // for gen zero kitties
        if (sire.matronId == ElrondU32.zero() || matron.matronId == ElrondU32.zero()) {
            return true;
        }

        // can't breed with full or half siblings
        if (sire.matronId == matron.matronId || sire.matronId == matron.sireId) {
            return false;
        }

        if (sire.sireId == matron.matronId || sire.sireId == matron.sireId) {
            return false;
        }

        return true
    }

    private getSireAllowedAddressOrDefault(
        kittyId: ElrondU32
    ): ManagedAddress {
        if (this.sireAllowedAddress(kittyId).isEmpty()) {
            return ManagedAddress.zero()
        } else {
            return this.sireAllowedAddress(kittyId).get()
        }
    }

    private transferEvent(
        from: ManagedAddress,
        to: ManagedAddress,
        tokenId: ElrondU32
    ): void {
        const event = new TransferEvent(
            ElrondString.fromString("transfer"),
            MultiValue3.from(
                from,
                to,
                tokenId
            ),
            ElrondString.fromString("")
        )

        event.emit()

        heap.free(changetype<i32>(event))
    }

    abstract totalKitties(): Mapping<ElrondU32>
    abstract birthFee(): Mapping<BigUint>
    abstract kitty(id: ElrondU32): Mapping<Kitty>
    abstract numberOwnedKitties(address: ManagedAddress): Mapping<ElrondU32>
    abstract sireAllowedAddress(kittyId: ElrondU32): Mapping<ManagedAddress>
    abstract approvedAddress(kittyId: ElrondU32): Mapping<ManagedAddress>
    abstract owner(kittyId: ElrondU32): Mapping<ManagedAddress>

    abstract geneScienceContractAddress(): Mapping<ManagedAddress>
    abstract kittyAuctionContractAddress(): Mapping<ManagedAddress>

}