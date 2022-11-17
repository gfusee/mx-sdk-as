import {KittyGenes} from "./kittyGenes";
import {ElrondU16, ElrondU32, ElrondU64, ElrondU8} from "@gfusee/elrond-wasm-as";
import {Color} from "./color";

const SECONDS_PER_MINUTE: u64 = 60
const MAX_COOLDOWN: u64 = 60 * 60 * 24 * 7 // 7 days
const MAX_TIREDNESS: u16 = 20

@struct
export class Kitty {
    genes: KittyGenes
    birthTime: ElrondU64
    cooldownEnd: ElrondU64
    matronId: ElrondU32
    sireId: ElrondU32
    siringWithId: ElrondU32
    nrChildren: ElrondU16
    generation: ElrondU16

    static new(
        genes: KittyGenes,
        birthTime: ElrondU64,
        matronId: ElrondU32,
        sireId: ElrondU32,
        generation: ElrondU16
    ): Kitty {
        const result = new Kitty()

        result.genes = genes
        result.birthTime = birthTime
        result.cooldownEnd = ElrondU64.zero()
        result.matronId = matronId
        result.sireId = sireId
        result.siringWithId = ElrondU32.zero()
        result.nrChildren = ElrondU16.zero()
        result.generation = generation

        return result
    }

    static default(): Kitty {
        const result = new Kitty()

        result.genes = KittyGenes.default()
        result.birthTime = ElrondU64.zero()
        result.cooldownEnd = ElrondU64.fromValue(u64.MAX_VALUE)
        result.matronId = ElrondU32.zero()
        result.sireId = ElrondU32.zero()
        result.siringWithId = ElrondU32.zero()
        result.nrChildren = ElrondU16.zero()
        result.generation = ElrondU16.zero()

        return result
    }

    getNextCooldownTime(): ElrondU64 {
        const tiredness = this.nrChildren + this.generation / ElrondU16.fromValue(2)

        if (tiredness > ElrondU16.fromValue(MAX_TIREDNESS)) {
            return ElrondU64.fromValue(MAX_COOLDOWN)
        }

        const cooldown = SECONDS_PER_MINUTE << tiredness.value
        if (cooldown > MAX_COOLDOWN) {
            return ElrondU64.fromValue(MAX_COOLDOWN)
        } else {
            return ElrondU64.fromValue(cooldown)
        }
    }

    getFurColor(): Color {
        return this.genes.furColor
    }

    getEyeColor(): Color {
        return this.genes.eyeColor
    }

    getMeowPower(): ElrondU8 {
        return this.genes.meowPower
    }

    isPregnant(): boolean {
        return this.siringWithId != ElrondU32.zero()
    }
}