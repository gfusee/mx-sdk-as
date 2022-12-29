import { bigIntGetCallValue, bigIntGetESDTCallValue, bigIntGetESDTCallValueByIndex, getESDTTokenName, getESDTTokenNameByIndex, getESDTTokenNonce, getESDTTokenNonceByIndex, getNumESDTTransfers } from "../utils/env";
import {BigUint, ElrondU32} from "../types";
import { ElrondArray } from "../types";
import { ElrondU64 } from "../types";
import { ElrondString } from "../types";
import { TokenIdentifier } from "../types";
import { TokenPayment } from "../types";

export class CallValue {

    private _egldValueCache: BigUint | null = null
    private _singlePaymentCache: TokenPayment | null = null
    private _singleEsdtPaymentCache: TokenPayment | null = null
    private _allEsdtPaymentsCache: ElrondArray<TokenPayment> | null = null

    get egldValue(): BigUint {
        if (this._egldValueCache) {
            return this._egldValueCache!
        } else {
            const value = BigUint.zero()
            bigIntGetCallValue(value.getHandle())
            this._egldValueCache = value
            return value
        }
    }

    get singlePayment(): TokenPayment {
        if (this._singlePaymentCache) {
            return this._singlePaymentCache!
        } else {
            let result: TokenPayment

            const numPayments = this.getNumberOfEsdtTransfers()
            if (numPayments == 0) {
                result = TokenPayment.new(
                    TokenIdentifier.egld(),
                    ElrondU64.zero(),
                    this.egldValue
                )
            } else if (numPayments == 1) {
                result = this.singleEsdtPayment
            } else {
                throw new Error('single payment expected, got multiples')
            }

            this._singlePaymentCache = result
            return result
        }


    }

    get singleEsdtPayment(): TokenPayment {
        if (this._singleEsdtPaymentCache) {
            return this._singleEsdtPaymentCache!
        } else {
            const payment = TokenPayment.new(
                this.getSingleEsdtPaymentTokenIdentifier(),
                this.getSingleEsdtPaymentTokenNonce(),
                this.getSingleEsdtPaymentValue()
            )
            this._singleEsdtPaymentCache = payment

            return payment
        }

    }

    get allEsdtPayments(): ElrondArray<TokenPayment> {
        if (this._allEsdtPaymentsCache) {
            return this._allEsdtPaymentsCache!
        } else {
            const numTransfers = ElrondU32.fromValue(this.getNumberOfEsdtTransfers())
            const result = ElrondArray.new<TokenPayment>()

            for (let i = ElrondU32.zero(); i < numTransfers; i++) {
                const payment = TokenPayment.new(
                    this.getEsdtPaymentTokenIdentifierByIndex(i),
                    this.getEsdtPaymentTokenNonceByIndex(i),
                    this.getEsdtPaymentValueByIndex(i)
                )

                result.push(payment)
            }

            this._allEsdtPaymentsCache = result

            return result
        }
    }

    private getNumberOfEsdtTransfers(): u32 {
        return getNumESDTTransfers() as u32
    }

    private getSingleEsdtPaymentTokenIdentifier(): TokenIdentifier {
        const bytes = new Uint8Array(TokenIdentifier.MAX_POSSIBLE_TOKEN_IDENTIFIER_LENGTH)
        const identifierLength = getESDTTokenName(changetype<i32>(bytes.buffer))
        const buffer = ElrondString.dummy().utils.fromBytes(bytes.slice(0, identifierLength))

        return TokenIdentifier.fromBuffer(buffer)
    }

    private getSingleEsdtPaymentTokenNonce(): ElrondU64 {
        return ElrondU64.fromValue(getESDTTokenNonce() as u64)
    }

    private getSingleEsdtPaymentValue(): BigUint {
        const value = BigUint.zero()
        bigIntGetESDTCallValue(value.getHandle())
        return value
    }

    private getEsdtPaymentTokenIdentifierByIndex(index: ElrondU32): TokenIdentifier {
        const bytes = new Uint8Array(TokenIdentifier.MAX_POSSIBLE_TOKEN_IDENTIFIER_LENGTH)
        let identifierLength = getESDTTokenNameByIndex(changetype<i32>(bytes.buffer), index.value as i32)
        let buffer = ElrondString.dummy().utils.fromBytes(bytes.slice(0, identifierLength))

        return TokenIdentifier.fromBuffer(buffer)
    }

    private getEsdtPaymentTokenNonceByIndex(index: ElrondU32): ElrondU64 {
        return ElrondU64.fromValue(getESDTTokenNonceByIndex(index.value as i32) as u64)
    }

    private getEsdtPaymentValueByIndex(index: ElrondU32): BigUint {
        const value = BigUint.zero()
        bigIntGetESDTCallValueByIndex(value.getHandle(), index.value as i32)
        return value
    }

}
