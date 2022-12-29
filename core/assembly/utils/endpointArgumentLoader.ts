import {BaseManagedType, BigUint, ElrondString, ElrondU32, ElrondU64} from "../types"
import {ArgumentLoader} from "./argumentLoader"
import {
    bigIntGetUnsignedArgument,
    getNumArguments,
    mBufferGetArgument,
    smallIntGetUnsignedArgument,
    Static
} from "./env"

export class EndpointArgumentLoader extends ArgumentLoader {

    private _currentIndex: ElrondU32 = ElrondU32.zero()
    private _numArguments: i64 = 0

    get currentIndex(): ElrondU32 {
        return this._currentIndex
    }

    set currentIndex(index: ElrondU32) {
        this._currentIndex = index
    }

    getRawArgumentAtIndex(index: ElrondU32): ElrondString {
        const newHandle = Static.nextHandle()
        mBufferGetArgument(index.value, newHandle)
        return ElrondString.fromHandle(newHandle)
    }

    getSmallIntUnsignedArgumentAtIndex(index: ElrondU32): i64 {
        return smallIntGetUnsignedArgument(index.value)
    }

    getBigIntUnsignedArgumentAtIndex(index: ElrondU32): BigUint {
        const newHandle = Static.nextHandle()
        bigIntGetUnsignedArgument(index.value, newHandle)

        return BigUint.fromHandle(newHandle)
    }

    getNumArguments(): ElrondU32 {
        if (this._numArguments == 0) {
            this._numArguments = getNumArguments()
        }

        return ElrondU32.fromValue(this._numArguments as u32)
    }

}
