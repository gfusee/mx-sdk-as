import {BigUint, ManagedBuffer, ManagedVoid, ManagedAddress, TokenType} from "../../types";
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
        tokenDisplayName: ManagedBuffer,
        tokenTicker: ManagedBuffer,
        initialSupply: BigUint,
        properties: FungibleTokenProperties
    ): ContractCall<ManagedVoid> {
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
        tokenDisplayName: ManagedBuffer,
        tokenTicker: ManagedBuffer,
        initialSupply: BigUint,
        properties: TokenProperties
    ): ContractCall<ManagedVoid> {
        const esdtSystemScAddress = this.esdtSystemScAddress()

        let endpointName: ManagedBuffer
        if (tokenType == TokenType.Fungible) {
            endpointName = ManagedBuffer.fromString(ISSUE_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.NonFungible) {
            endpointName = ManagedBuffer.fromString(ISSUE_NON_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.SemiFungible) {
            endpointName = ManagedBuffer.fromString(ISSUE_SEMI_FUNGIBLE_ENDPOINT_NAME)
        } else if (tokenType == TokenType.Meta) {
            endpointName = ManagedBuffer.fromString(REGISTER_META_ESDT_ENDPOINT_NAME)
        } else if (tokenType == TokenType.Invalid) {
            endpointName = ManagedBuffer.fromString('')
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
            ManagedBuffer.fromString('canFreeze'),
            properties.canFreeze
        )
        setTokenProperty(
            contractCall,
            ManagedBuffer.fromString('canWipe'),
            properties.canWipe
        )
        setTokenProperty(
            contractCall,
            ManagedBuffer.fromString('canPause'),
            properties.canPause
        )

        if (tokenType == TokenType.Fungible) {
            setTokenProperty(
                contractCall,
                ManagedBuffer.fromString('canMint'),
                properties.canMint
            )
            setTokenProperty(
                contractCall,
                ManagedBuffer.fromString('canBurn'),
                properties.canBurn
            )
        }

        setTokenProperty(
            contractCall,
            ManagedBuffer.fromString('canChangeOwner'),
            properties.canChangeOwner
        )
        setTokenProperty(
            contractCall,
            ManagedBuffer.fromString('canUpgrade'),
            properties.canUpgrade
        )
        setTokenProperty(
            contractCall,
            ManagedBuffer.fromString('canAddSpecialRoles'),
            properties.canAddSpecialRoles
        )

        return contractCall
    }

    private esdtSystemScAddress(): ManagedAddress {
        return ManagedAddress.from(ManagedBuffer.fromString(ESDT_SYSTEM_SC_ADDRESS_BECH32))
    }

}

const TRUE_BYTES: string = "true"
const FALSE_BYTES: string = "false"

function getBooleanName(b: boolean): ManagedBuffer {
    if (b) {
        return ManagedBuffer.fromString(TRUE_BYTES)
    } else {
        return ManagedBuffer.fromString(FALSE_BYTES)
    }
}

function setTokenProperty(contractCall: ContractCall, name: ManagedBuffer, value: boolean): void {
    contractCall.pushArgumentRaw(name)
    contractCall.pushArgumentRaw(getBooleanName(value))
}
