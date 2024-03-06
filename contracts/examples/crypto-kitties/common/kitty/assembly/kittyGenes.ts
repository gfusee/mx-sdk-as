import {Color} from "./color";
import {ManagedU8} from "@gfusee/mx-sdk-as";
import {Random} from "../../random/assembly"

@struct
export class KittyGenes {

    furColor: Color
    eyeColor: Color
    meowPower: ManagedU8 // the higher the value, the louder the cat

    static new(
        furColor: Color,
        eyeColor: Color,
        meowPower: ManagedU8
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
        result.meowPower = ManagedU8.zero()

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
