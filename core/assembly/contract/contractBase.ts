import { ManagedBuffer } from "../types/buffer";
import { ManagedType } from "../types/interfaces/managedType";
import { Blockchain } from "./blockchain";
import { CallValue } from "./callValue";
import { SendWrapper } from "./sendWrapper";
import {CryptoWrapper} from "./cryptoWrapper";

export function getContractInstance<T extends ContractBase>(): T {
    return __CURRENT_CONTRACT!
}

class GlobalContractCache {

    static _callValueCache: CallValue | null = null
    static _blockchainCache: Blockchain | null = null
    static _sendWrapperCache: SendWrapper | null = null
    static _cryptoWrapperCache: CryptoWrapper | null = null

    private constructor() {}

}

export class ContractBase {

    get callValue(): CallValue {
        if (GlobalContractCache._callValueCache != null) {
            return GlobalContractCache._callValueCache!
        } else {
            const newValue = new CallValue()
            GlobalContractCache._callValueCache = newValue

            return newValue
        }
    }

    get blockchain(): Blockchain {
        if (GlobalContractCache._blockchainCache != null) {
            return GlobalContractCache._blockchainCache!
        } else {
            const newValue = new Blockchain()
            GlobalContractCache._blockchainCache = newValue

            return newValue
        }
    }

    get send(): SendWrapper {
        if (GlobalContractCache._sendWrapperCache != null) {
            return GlobalContractCache._sendWrapperCache!
        } else {
            const newValue = new SendWrapper()
            GlobalContractCache._sendWrapperCache = newValue

            return newValue
        }
    }

    get crypto(): CryptoWrapper {
        if (GlobalContractCache._cryptoWrapperCache != null) {
            return GlobalContractCache._cryptoWrapperCache!
        } else {
            const newValue = new CryptoWrapper()
            GlobalContractCache._cryptoWrapperCache = newValue

            return newValue
        }
    }

    require(condition: bool, message: string): void {
        if (!condition) {
            this.panic(message)
        }
    }

    panic(message: string): void {
        this.panicTyped(ManagedBuffer.fromString(message))
    }

    private panicTyped<T extends ManagedType>(value: T): void {
        value.utils.signalError()
    }

}
