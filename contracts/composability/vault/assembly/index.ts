//@ts-nocheck

import {
    ContractBase, ElrondArray,
    ElrondEvent, ElrondU32,
    MultiValue1, MultiValue2, MultiValue3,
    MultiValueEncoded,
    TokenPayment
} from "@gfusee/elrond-wasm-as"
import {ElrondString} from "@gfusee/elrond-wasm-as"
import {BigUint, ElrondU64, Mapping, TokenIdentifier} from "@gfusee/elrond-wasm-as"

class AcceptFundsEgldEvent extends ElrondEvent<MultiValue1<BigUint>, ElrondString> {}
class AcceptFundsEsdtEvent extends ElrondEvent<MultiValue1<MultiValueEncoded<TokenPayment>>, ElrondString> {} //TODO : replace when TopDecodeMulti is implemented
class RetrieveFundsEvent extends ElrondEvent<MultiValue3<TokenIdentifier, ElrondU64, BigUint>, ElrondString> {}

@contract
abstract class VaultContract extends ContractBase {

    acceptFunds(): void {
        const egldPayment = this.callValue.egldValue

        if (egldPayment > BigUint.zero()) {
            const event = new AcceptFundsEgldEvent(
                ElrondString.fromString("acceptFunds"),
                MultiValue1.from<BigUint>(
                    this.callValue.egldValue
                ),
                ElrondString.fromString("")
            )
            event.emit()
        } else {
            //TODO : esdtTransfersMulti event, when TopEncodeMulti will be implemented
            const event = new AcceptFundsEsdtEvent(
                ElrondString.fromString("acceptFunds"),
                MultiValue1.from<MultiValueEncoded<TokenPayment>>(
                    this.callValue.allEsdtPayments.toMultiValueEncoded()
                ),
                ElrondString.fromString("")
            )
            event.emit()
        }

        const mapping = this.callCounts(ElrondString.fromString("acceptFunds"))
        mapping.set(mapping.get() + ElrondU64.fromValue(1))
    }

    acceptFundsEchoPayment(): MultiValue2<BigUint, MultiValueEncoded<TokenPayment>> {
        const egldValue = this.callValue.egldValue
        const payments = this.callValue.allEsdtPayments.toMultiValueEncoded()

        const mapping = this.callCounts(ElrondString.fromString("acceptFundsEchoPayment"))
        mapping.set(mapping.get() + ElrondU64.fromValue(1))

        return MultiValue2.from(
            egldValue,
            payments
        )
    }

    retrieveFunds(
        token: TokenIdentifier,
        nonce: ElrondU64,
        amount: BigUint
    ): void {
        const caller = this.blockchain.caller

        const event = new RetrieveFundsEvent(
            ElrondString.fromString("retrieveFunds"),
            MultiValue3.from(
                token,
                nonce,
                amount
            ),
            ElrondString.new()
        )
        event.emit()

        if (token.isValidESDTIdentifier()) {
            this.send.transferEsdtViaAsyncCall(caller, token, nonce, amount, ElrondU64.fromValue(20_000_000))
        } else {
            this.send.directEgld(caller, amount)
        }
    }

    echoArguments(
        args: MultiValueEncoded<ElrondString>
    ): MultiValueEncoded<ElrondString> {
        const mapping = this.callCounts(ElrondString.fromString("echoArguments"))
        mapping.set(mapping.get() + ElrondU64.fromValue(1))

        return args
    }

    abstract callCounts(endpoint: ElrondString): Mapping<ElrondU64>

}
