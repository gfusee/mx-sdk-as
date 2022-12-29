import {
    BaseManagedType,
    BigUint,
    ElrondArray,
    ElrondString,
    ElrondU32,
    ElrondU64,
    ManagedBufferNestedDecodeInput
} from "../types"
import {ArgumentLoader} from "./argumentLoader"
import {
    bigIntGetUnsignedArgument,
    getNumArguments, managedGetCallbackClosure,
    mBufferGetArgument,
    smallIntGetUnsignedArgument,
    Static
} from "./env"

export class CallbackArgumentLoader extends ArgumentLoader {

    private callbackData: ElrondArray<ElrondString>

    private _currentIndex: ElrondU32 = ElrondU32.zero()
    private _numArguments: ElrondU32 = ElrondU32.zero()

    constructor() {
        super()

        const buffer = ElrondString.new()
        managedGetCallbackClosure(buffer.getHandle())
        this.callbackData = BaseManagedType.dummy<ElrondArray<ElrondString>>().utils.decodeTop(buffer)
    }

    get currentIndex(): ElrondU32 {
        return this._currentIndex
    }

    set currentIndex(index: ElrondU32) {
        this._currentIndex = index
    }

    getRawArgumentAtIndex(index: ElrondU32): ElrondString {
        return this.callbackData.get(index)
    }

    getSmallIntUnsignedArgumentAtIndex(index: ElrondU32): i64 {
        return this.callbackData.get(index).utils.intoTop<ElrondU64>().value
    }

    getBigIntUnsignedArgumentAtIndex(index: ElrondU32): BigUint {
        return BigUint.fromElrondString(this.callbackData.get(index))
    }

    getNumArguments(): ElrondU32 {
        if (this._numArguments == ElrondU32.zero()) {
            this._numArguments = this.callbackData.getLength()
        }

        return this._numArguments
    }

}
