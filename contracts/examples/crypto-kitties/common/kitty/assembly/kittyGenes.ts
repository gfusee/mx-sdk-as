import {Color} from "./color";
import {ElrondU8} from "@gfusee/elrond-wasm-as";
import {Random} from "../../random/assembly"

@struct
export class KittyGenes {

    furColor: Color
    eyeColor: Color
    meowPower: ElrondU8 // the higher the value, the louder the cat

    static new(
        furColor: Color,
        eyeColor: Color,
        meowPower: ElrondU8
    ): KittyGenes {
        const result = new KittyGenes()

        result.furColor = furColor
        result.eyeColor = eyeColor
        result.meowPower = meowPower

        return result
    }

    static default(): KittyGenes {
        const result = new KittyGenes()

        result.furColor = Color.default()
        result.eyeColor = Color.default()
        result.meowPower = ElrondU8.zero()

        return result
    }

    static random(random: Random): KittyGenes {
        return KittyGenes.new(
            Color.random(random),
            Color.random(random),
            random.nextU8()
        )
    }

}