import {ElrondU8} from "@gfusee/elrond-wasm-as";
import {Random} from "../../random/assembly"

@struct
export class Color {

    r: ElrondU8
    g: ElrondU8
    b: ElrondU8

    static new(
        r: ElrondU8,
        g: ElrondU8,
        b: ElrondU8
    ): Color {
        const result = new Color()

        result.r = r
        result.g = g
        result.b = b

        return result
    }

    static default(): Color {
        const result = new Color()

        result.r = ElrondU8.zero()
        result.g = ElrondU8.zero()
        result.b = ElrondU8.zero()

        return result
    }

    static random(random: Random): Color {
        return Color.new(
            random.nextU8(),
            random.nextU8(),
            random.nextU8()
        )
    }

    mixWith(
        otherColor: Color,
        ratioFirst: ElrondU8,
        rationSecond: ElrondU8
    ): Color {

        const r = ((this.r.value as u16 * ratioFirst.value as u16 + otherColor.r.value as u16 * rationSecond.value as u16)
            / 100) as u8

        const g = ((this.g.value as u16 * ratioFirst.value as u16 + otherColor.g.value as u16 * rationSecond.value as u16)
            / 100) as u8

        const b = ((this.r.value as u16 * ratioFirst.value as u16 + otherColor.r.value as u16 * rationSecond.value as u16)
            / 100) as u8

        return Color.new(
            ElrondU8.fromValue(r),
            ElrondU8.fromValue(g),
            ElrondU8.fromValue(b)
        )

    }
}