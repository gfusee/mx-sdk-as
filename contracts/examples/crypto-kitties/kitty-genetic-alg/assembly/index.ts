//@ts-nocheck

import { Kitty } from '../../common/kitty/assembly/index'
import { KittyGenes } from '../../common/kitty/assembly/kittyGenes'
import { Random } from '../../common/random/assembly/index'
import {ContractBase, ElrondU8} from "@gfusee/elrond-wasm-as";

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

        const furColorPercentage = ElrondU8.fromValue(1) + random.nextU8() % ElrondU8.fromValue(99)  // val in [1, 100)
        const matronFurColor = matron.getFurColor()
        const sireFurColor = sire.getFurColor()
        const kittyFurColor = matronFurColor.mixWith(
            sireFurColor,
            furColorPercentage,
            ElrondU8.fromValue(100) - furColorPercentage
        )

        const eyeColorPercentage = ElrondU8.fromValue(1) + random.nextU8() % ElrondU8.fromValue(99)  // val in [1, 100)
        const matronEyeColor = matron.getEyeColor()
        const sireEyeColor = sire.getEyeColor()
        const kittyEyeColor = matronEyeColor.mixWith(
            sireEyeColor,
            eyeColorPercentage,
            ElrondU8.fromValue(100) - eyeColorPercentage
        )

        const kittyMeowPower = matron.getMeowPower() / ElrondU8.fromValue(2) + sire.getMeowPower() / ElrondU8.fromValue(2)

        return KittyGenes.new(
            kittyFurColor,
            kittyEyeColor,
            kittyMeowPower
        )
    }

}