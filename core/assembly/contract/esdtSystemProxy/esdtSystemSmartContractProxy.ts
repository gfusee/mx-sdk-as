import {BigUint, ElrondString, ElrondVoid, ManagedAddress, TokenType} from "../../types";
import {FungibleTokenProperties, TokenProperties} from "./tokenProperties";
import {ContractCall} from "../call/contractCall";

const ESDT_SYSTEM_SC_ADDRESS_BECH32: string = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u"

const ISSUE_FUNGIBLE_ENDPOINT_NAME: string = "issue";
const ISSUE_NON_FUNGIBLE_ENDPOINT_NAME: string = "issueNonFungible";
const ISSUE_SEMI_FUNGIBLE_ENDPOINT_NAME: string = "issueSemiFungible";
const REGISTER_META_ESDT_ENDPOINT_NAME: string = "registerMetaESDT";
const ISSUE_AND_SET_ALL_ROLES_ENDPOINT_NAME: string = "registerAndSetAllRoles";

export class EsdtSystemSmartContractProxy {

    issueFungible(
        issueCost: BigUint,
        tokenDisplayName: ElrondString,
        tokenTicker: ElrondString,
        initialSupply: BigUint,
        properties: FungibleTokenProperties
    ): ContractCall<ElrondVoid> {
        return this.issue(
            issueCost,
            TokenType.Fungible,
            tokenDisplayName,
            tokenTicker,
            initialSupply,
            properties
        )
    }

    private issue(
        issueCost: BigUint,
        tokenType: TokenType,
        tokenDisplayName: ElrondString,
        tokenTicker: ElrondString,
        initialSupply: BigUint,
        properties: TokenProperties
    ): ContractCall<ElrondVoid> {
        const esdtSystemScAddress = this.esdtSystemScAddress()

        let endpointName: ElrondString
        if (tokenType == TokenType.Fungible) {
            endpointName = ElrondString.fromString(ISSUE_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.NonFungible) {
            endpointName = ElrondString.fromString(ISSUE_NON_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.SemiFungible) {
            endpointName = ElrondString.fromString(ISSUE_SEMI_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.Meta) {
            endpointName = ElrondString.fromString(REGISTER_META_ESDT_ENDPOINT_NAME)
        } else if (tokenType == TokenType.Invalid) {
            endpointName = ElrondString.fromString('')
        } else {
            throw new Error('Unknown token type')
        }

        const contractCall = ContractCall.new(
            esdtSystemScAddress,
            endpointName
        )
        .withEgldTransfer(issueCost)

        contractCall.pushEndpointArg(tokenDisplayName)
        contractCall.pushEndpointArg(tokenTicker)

        if (tokenType == TokenType.Fungible) {
            contractCall.pushEndpointArg(initialSupply)
            contractCall.pushEndpointArg(properties.numberOfDecimals)
        } else if (tokenType == TokenType.Meta) {
            contractCall.pushEndpointArg(properties.numberOfDecimals)
        }

        setTokenProperty(
            contractCall,
            ElrondString.fromString('canFreeze'),
            properties.canFreeze
        )
        setTokenProperty(
            contractCall,
            ElrondString.fromString('canWipe'),
            properties.canWipe
        )
        setTokenProperty(
            contractCall,
            ElrondString.fromString('canPause'),
            properties.canPause
        )

        if (tokenType == TokenType.Fungible) {
            setTokenProperty(
                contractCall,
                ElrondString.fromString('canMint'),
                properties.canMint
            )
            setTokenProperty(
                contractCall,
                ElrondString.fromString('canBurn'),
                properties.canBurn
            )
        }

        setTokenProperty(
            contractCall,
            ElrondString.fromString('canChangeOwner'),
            properties.canChangeOwner
        )
        setTokenProperty(
            contractCall,
            ElrondString.fromString('canUpgrade'),
            properties.canUpgrade
        )
        setTokenProperty(
            contractCall,
            ElrondString.fromString('canAddSpecialRoles'),
            properties.canAddSpecialRoles
        )

        return contractCall
    }

    private esdtSystemScAddress(): ManagedAddress {
        return ManagedAddress.from(ElrondString.fromString(ESDT_SYSTEM_SC_ADDRESS_BECH32))
    }

}

const TRUE_BYTES: string = "true"
const FALSE_BYTES: string = "false"

function getBooleanName(b: boolean): ElrondString {
    if (b) {
        return ElrondString.fromString(TRUE_BYTES)
    } else {
        return ElrondString.fromString(FALSE_BYTES)
    }
}

function setTokenProperty(contractCall: ContractCall, name: ElrondString, value: boolean): void {
    contractCall.pushArgumentRaw(name)
    contractCall.pushArgumentRaw(getBooleanName(value))
}