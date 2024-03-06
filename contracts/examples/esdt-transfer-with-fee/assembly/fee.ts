//@ts-nocheck

import {
    BaseManagedType,
    ManagedBuffer,
    ManagedU32, ManagedBufferNestedDecodeInput, MultiValue,
    MultiValue1,
    MultiValue2,
    OptionalValue, TokenPayment
} from "@gfusee/mx-sdk-as";

export const PERCENTAGE_DIVISOR: u32 = 10000

@enumtype
export enum FeeType {
    Unset,
    ExactValue,
    Percentage
}

@unmanaged
export class AbstractFee extends MultiValue2<FeeType, OptionalValue<ManagedBuffer>> {

    private constructor() {
        super();
    }

    static from(type: FeeType, value: OptionalValue<ManagedBuffer>): AbstractFee {
        const result = new AbstractFee()
        result.pushItem(type)
        result.pushItem(value)

        return result
    }

    get type(): FeeType {
        return this.a
    }

    get utils(): MultiValue.Utils<AbstractFee> {
        return new MultiValue.Utils<AbstractFee>(this)
    }

    intoUnset(): FeeUnset {
        if (this.type == FeeType.Unset) {
            return FeeUnset.new()
        } else {
            ManagedBuffer.fromString("Wrong type").utils.signalError()
        }
    }

    intoExactValue(): FeeExactValue {
        if (this.type == FeeType.ExactValue) {
            const value = this.b.value!.utils.intoTop<TokenPayment>()

            return FeeExactValue.from(value)
        } else {
            ManagedBuffer.fromString("Wrong type").utils.signalError()
            throw ''
        }
    }

    intoPercentage(): FeePercentage {
        if (this.type == FeeType.Percentage) {
            const percentage = this.b.value!.utils.intoTop<ManagedU32>()

            return FeePercentage.from(percentage)
        } else {
            throw new Error("Wrong type")
        }
    }

    decodeNested(input: ManagedBufferNestedDecodeInput): AbstractFee {
        if (input.getRemainingLength() === ManagedU32.zero()) {
            this.pushItem(FeeType.Unset)
        } else {
            const a = FeeType.dummy().utils.decodeNested(input)

            this.pushItem(a)

            let item: OptionalValue<ManagedBuffer> = OptionalValue.null<ManagedBuffer>()
            if (a == FeeType.ExactValue) {
                const secondItem = BaseManagedType.dummy<TokenPayment>().utils.decodeNested(input)
                item = OptionalValue.withValue(secondItem.utils.encodeTop()) // TODO : optimization
            } else if (a == FeeType.Percentage) {
                const secondItem = BaseManagedType.dummy<ManagedU32>().utils.decodeNested(input)
                item = OptionalValue.withValue(secondItem.utils.encodeTop()) // TODO : optimization
            }

            this.pushItem(item)
        }

        return this
    }

}

@unmanaged
export class FeeUnset extends MultiValue1<FeeType> {

    static new(): FeeUnset {
        const result = new FeeUnset()
        result.pushItem(FeeType.Unset)

        return result
    }

    get type(): FeeType {
        return this.a
    }

}

@unmanaged
export class FeeExactValue extends MultiValue2<FeeType, TokenPayment> {

    static from(value: TokenPayment): FeeExactValue {
        const result = new FeeExactValue()
        result.pushItem(FeeType.ExactValue)
        result.pushItem(value)

        return result
    }

    get type(): FeeType {
        return this.a
    }

    get exactValue(): TokenPayment {
        return this.b
    }

}

@unmanaged
export class FeePercentage extends MultiValue2<FeeType, ManagedU32> {

    static from(percentage: ManagedU32): FeePercentage {
        const result = new FeePercentage()

        result.pushItem(FeeType.Percentage)
        result.pushItem(percentage)
        return result
    }

    get type(): FeeType {
        return this.a
    }

    get percentage(): ManagedU32 {
        return this.b
    }

}
