//@ts-nocheck

import {
    BigUint, CodeMetadata, CodeMetadataFlag,
    ContractBase,
    ManagedAddress, MapMapping, Option,
    TokenIdentifier, ManagedArgsBuffer
} from "@gfusee/elrond-wasm-as";

@struct
class TokenIdPair {

    firstTokenId: TokenIdentifier
    secondTokenId: TokenIdentifier

    static new(
        firstTokenId: TokenIdentifier,
        secondTokenId: TokenIdentifier
    ): TokenIdPair {
        const result = new TokenIdPair()

        result.firstTokenId = firstTokenId
        result.secondTokenId = secondTokenId
    }

}

@contract
abstract class Factory extends ContractBase {

    pairTemplateAddress!: ManagedAddress

    constructor(
        pairTemplateAddress: ManagedAddress
    ) {
        super();

        this.pairTemplateAddress = pairTemplateAddress
    }

    createPair(
        tokenIdPair: TokenIdPair
    ): ManagedAddress {
        this.require(
            this.getPair(tokenIdPair).isNull(),
            "Already has pair"
        )

        const arguments = new ManagedArgBuffer()
        arguments.pushArg(tokenIdPair.firstTokenId)
        arguments.pushArg(tokenIdPair.secondTokenId)

        const deployResults = this.send.deployFromSourceContract(
            this.blockchain.getGasLeft(),
            BigUint.zero(),
            this.pairTemplateAddress,
            new CodeMetadata(
                false,
                false,
                false,
                false
            ),
            arguments
        )

        this.pairs().insert(tokenIdPair, deployResults.a)

        deployResults.a
    }

    getPair(
        tokenIdPair: TokenIdPair
    ): Option<ManagedAddress> {
        const optAddress = this.pairs().get(tokenIdPair)

        if (optAddress.isNull()) {
            return this.pairs().get(
                TokenIdPair.new(
                    tokenIdPair.secondTokenId,
                    tokenIdPair.firstTokenId
                )
            )
        } else {
            return optAddress
        }
    }

    abstract pairs(): MapMapping<TokenIdPair, ManagedAddress>

}