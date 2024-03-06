//@ts-nocheck

import { Kitty } from '../../common/kitty/assembly/index'
import { KittyGenes } from '../../common/kitty/assembly/kittyGenes'
import { Random } from '../../common/random/assembly/index'
import {ContractBase, ManagedU8} from "@gfusee/mx-sdk-as";

@contract
abstract class KittyGenericAlg extends ContractBase {
    generateKittyGenes(
        matron: Kitty,
        sire: Kitty
    ): KittyGenes {

        const random = Random.new(
            this.blockchain.currentBlockRandomSeed,
            this.blockchain.txHash
        )

        const furColorPercentage = ManagedU8.fromValue(1) + random.nextU8() % ManagedU8.fromValue(99)  // val in [1, 100)
        const matronFurColor = matron.getFurColor()
        const sireFurColor = sire.getFurColor()
        const kittyFurColor = matronFurColor.mixWith(
            sireFurColor,
            furColorPercentage,
            ManagedU8.fromValue(100) - furColorPercentage
        )

        const eyeColorPercentage = ManagedU8.fromValue(1) + random.nextU8() % ManagedU8.fromValue(99)  // val in [1, 100)
        const matronEyeColor = matron.getEyeColor()
        const sireEyeColor = sire.getEyeColor()
        const kittyEyeColor = matronEyeColor.mixWith(
            sireEyeColor,
            eyeColorPercentage,
            ManagedU8.fromValue(100) - eyeColorPercentage
        )

        const kittyMeowPower = matron.getMeowPower() / ManagedU8.fromValue(2) + sire.getMeowPower() / ManagedU8.fromValue(2)

        return KittyGenes.new(
            kittyFurColor,
            kittyEyeColor,
            kittyMeowPower
        )
    }

}
