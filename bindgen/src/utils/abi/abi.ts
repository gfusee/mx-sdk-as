import {AbiBuildInfo} from "./abiBuildInfo.js";
import {AbiConstructor} from "./abiConstructor.js";
import {AbiEndpoint} from "./abiEndpoint.js";
import {AbiEvent} from "./abiEvent.js";
import {AbiEnumType} from "./abiEnumType.js";
import {AbiStructType} from "./abiStructType.js";
import {AbiEndpointInput} from "./abiEndpointInput.js"
import {AbiEndpointOutput} from "./abiEndpointOutput.js"
import {AbiStructTypeField} from "./abiStructTypeField.js"

export type Types = { [key: string] : AbiEnumType | AbiStructType }

export class Abi {

    private static asToAbiTypesMap = {
        ElrondString: "bytes",
        ElrondBoolean: "bool",
        ElrondArray: "List",
        ManagedAddress: "Address",
        ElrondU8: "u8",
        ElrondU16: "u16",
        ElrondU32: "u32",
        ElrondU64: "u64",
        TokenIdentifier: "EgldOrEsdtTokenIdentifier",
        TokenPayment: "EgldOrEsdtTokenPayment",
        OptionalValue: "optional",
        MultiValueEncoded: "variadic",
        MultiValueElrondArray: "variadic",
        MultiValue1: "multi",
        MultiValue2: "multi",
        MultiValue3: "multi",
        MultiValue4: "multi",
        MultiValue5: "multi",
        MultiValue6: "multi",
        MultiValue7: "multi",
        MultiValue9: "multi",
        MultiValue10: "multi"
    }

    private static multiArgsTypes = [
        "optional",
        "variadic"
    ]

    constructor(
        public buildInfo: AbiBuildInfo,
        public name: string,
        public init: AbiConstructor,
        public endpoints: AbiEndpoint[],
        public events: AbiEvent[],
        public hasCallback: boolean,
        public types: Types
    ) {}

    intoJSON(): string {
        const newAbi = new Abi(
            this.buildInfo,
            this.name,
            this.parseConstructor(),
            this.endpoints.map(e => this.parseEndpoint(e)),
            this.events,
            this.hasCallback,
            this.parseTypes(this.types)
        );
        const abiObject = Object.assign({}, newAbi) as any

        abiObject.constructor = abiObject.init
        abiObject.init = undefined

        return JSON.stringify(abiObject, null, 4);
    }

    private transformAsTypeIntoAbiType(asType: string): string {
        for (const key of Object.keys(Abi.asToAbiTypesMap)) {
            const genericRegex = /(.+)<(.+)>/g
            const matches = genericRegex.exec(asType)
            if (matches !== null) {
                const mainType = asType.substring(0, asType.indexOf('<'))
                const parsedMainType = this.transformAsTypeIntoAbiType(mainType)
                const genericsTypesRaw = asType.substring(asType.indexOf('<') + 1, asType.length - 1)
                const genericTypesRegex = /(\w+(?:<.+>)*)/g
                const typesMatches = genericsTypesRaw.matchAll(genericTypesRegex)
                let type = typesMatches.next()
                let parsedTypes: string[] = []
                while (!type.done) {
                    parsedTypes.push(this.transformAsTypeIntoAbiType(type.value[0]))
                    type = typesMatches.next()
                }

                return `${parsedMainType}<${parsedTypes.join(',')}>`
            } else {
                if (asType === key) {
                    return Abi.asToAbiTypesMap[key]
                }
            }
        }

        return asType
    }

    private isAbiTypeMultiArgOrResult(rustType: string): boolean {
        for (const type of Abi.multiArgsTypes) {
            if (rustType.startsWith(`${type}<`)) {
                return true
            }
        }

        return false
    }

    private parseEndpointsInputs(inputs: AbiEndpointInput[]): AbiEndpointInput[] {
        return inputs.map((value, index) => {
            const newType = this.transformAsTypeIntoAbiType(value.type)

            return new AbiEndpointInput(
                value.name,
                newType,
                this.isAbiTypeMultiArgOrResult(newType) && index == inputs.length - 1 ? true : undefined
            )
        })
    }

    private parseEndpointsOutputs(outputs: AbiEndpointOutput[]): AbiEndpointOutput[] {
        return outputs
            .filter(e => e.type !== "void")
            .map((value, index) => {
                const newType = this.transformAsTypeIntoAbiType(value.type)

                return new AbiEndpointOutput(
                    newType,
                    this.isAbiTypeMultiArgOrResult(newType) && index == outputs.length - 1 ? true : undefined
                )
            })
    }

    private parseTypes(types: Types): Types {
        const newTypes: Types = {}

        for (const key of Object.keys(types)) {
            const value = types[key]

            if (value instanceof AbiStructType) {
                newTypes[key] = new AbiStructType(
                    value.fields.map((field, index) => {
                        return new AbiStructTypeField(
                            field.name,
                            this.transformAsTypeIntoAbiType(field.type)
                        )
                    })
                )
            } else {
                newTypes[key] = types[key]
            }
        }

        return newTypes
    }

    private parseConstructor(): AbiConstructor {
        return new AbiConstructor(
            this.parseEndpointsInputs(this.init.inputs),
            this.parseEndpointsOutputs(this.init.outputs),
        )
    }

    private parseEndpoint(endpoint: AbiEndpoint): AbiEndpoint {
        return new AbiEndpoint(
            endpoint.name,
            endpoint.onlyOwner,
            endpoint.mutability,
            endpoint.payableInTokens,
            this.parseEndpointsInputs(endpoint.inputs),
            this.parseEndpointsOutputs(endpoint.outputs),
        )
    }

}
