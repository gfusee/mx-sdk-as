import {BaseManagedType, BigUint, ElrondString, ElrondU32} from "../types"

export abstract class ArgumentLoader {

    abstract get currentIndex(): ElrondU32
    abstract set currentIndex(index: ElrondU32)

    abstract getRawArgumentAtIndex(index: ElrondU32): ElrondString
    abstract getSmallIntUnsignedArgumentAtIndex(index: ElrondU32): i64
    abstract getBigIntUnsignedArgumentAtIndex(index: ElrondU32): BigUint
    abstract getNumArguments(): ElrondU32

}
