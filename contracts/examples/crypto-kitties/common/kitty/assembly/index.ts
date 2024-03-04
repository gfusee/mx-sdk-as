import {KittyGenes} from "./kittyGenes";
import {ManagedU16, ManagedU32, ManagedU64, ManagedU8} from "@gfusee/mx-sdk-as";
import {Color} from "./color";

const SECONDS_PER_MINUTE: u64 = 60
const MAX_COOLDOWN: u64 = 60 * 60 * 24 * 7 // 7 days
const MAX_TIREDNESS: u16 = 20

@struct
export class Kitty {
    genes: KittyGenes
    birthTime: ManagedU64
    cooldownEnd: ManagedU64
    matronId: ManagedU32
    sireId: ManagedU32
    siringWithId: ManagedU32
    nrChildren: ManagedU16
    generation: ManagedU16

    static new(
        genes: KittyGenes,
        birthTime: ManagedU64,
        matronId: ManagedU32,
        sireId: ManagedU32,
        generation: ManagedU16
    ): Kitty {
        const result = new Kitty()

        result.genes = genes
        result.birthTime = birthTime
        result.cooldownEnd = ManagedU64.zero()
        result.matronId = matronId
        result.sireId = sireId
        result.siringWithId = ManagedU32.zero()
        result.nrChildren = ManagedU16.zero()
        result.generation = generation

        return result
    }

    static default(): Kitty {
        const result = new Kitty()

        result.genes = KittyGenes.default()
        result.birthTime = ManagedU64.zero()
        result.cooldownEnd = ManagedU64.fromValue(u64.MAX_VALUE)
        result.matronId = ManagedU32.zero()
        result.sireId = ManagedU32.zero()
        result.siringWithId = ManagedU32.zero()
        result.nrChildren = ManagedU16.zero()
        result.generation = ManagedU16.zero()

        return result
    }

    getNextCooldownTime(): ManagedU64 {
        const tiredness = this.nrChildren + this.generation / ManagedU16.fromValue(2)

        if (tiredness > ManagedU16.fromValue(MAX_TIREDNESS)) {
            return ManagedU64.fromValue(MAX_COOLDOWN)
        }

        const cooldown = SECONDS_PER_MINUTE << tiredness.value
        if (cooldown > MAX_COOLDOWN) {
            return ManagedU64.fromValue(MAX_COOLDOWN)
        } else {
            return ManagedU64.fromValue(cooldown)
        }
    }

    getFurColor(): Color {
        return this.genes.furColor
    }

    getEyeColor(): Color {
        return this.genes.eyeColor
    }

    getMeowPower(): ManagedU8 {
        return this.genes.meowPower
    }

    isPregnant(): boolean {
        return this.siringWithId != ManagedU32.zero()
    }
}
