import {ManagedU8} from "@gfusee/mx-sdk-as";
import {Random} from "../../random/assembly"

@struct
export class Color {

    r: ManagedU8
    g: ManagedU8
    b: ManagedU8

    static new(
        r: ManagedU8,
        g: ManagedU8,
        b: ManagedU8
    ): Color {
        const result = new Color()

        result.r = r
        result.g = g
        result.b = b

        return result
    }

    static default(): Color {
        const result = new Color()

        result.r = ManagedU8.zero()
        result.g = ManagedU8.zero()
        result.b = ManagedU8.zero()

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
        ratioFirst: ManagedU8,
        rationSecond: ManagedU8
    ): Color {

        const r = ((this.r.value as u16 * ratioFirst.value as u16 + otherColor.r.value as u16 * rationSecond.value as u16)
            / 100) as u8

        const g = ((this.g.value as u16 * ratioFirst.value as u16 + otherColor.g.value as u16 * rationSecond.value as u16)
            / 100) as u8

        const b = ((this.r.value as u16 * ratioFirst.value as u16 + otherColor.r.value as u16 * rationSecond.value as u16)
            / 100) as u8

        return Color.new(
            ManagedU8.fromValue(r),
            ManagedU8.fromValue(g),
            ManagedU8.fromValue(b)
        )

    }
}
