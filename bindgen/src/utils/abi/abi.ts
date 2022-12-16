import {AbiBuildInfo} from "./abiBuildInfo.js";
import {AbiConstructor} from "./abiConstructor.js";
import {AbiEndpoint} from "./abiEndpoint.js";
import {AbiEvent} from "./abiEvent.js";
import {AbiEnumType} from "./abiEnumType.js";
import {AbiStructType} from "./abiStructType.js";
import {AbiEndpointInput} from "./abiEndpointInput.js"
import {AbiEndpointOutput} from "./abiEndpointOutput.js"

export class Abi {

    private static asToRustTypesMap = {
        ElrondString: "ManagedBuffer",
        ElrondArray: "ManagedVec",
        ElrondU8: "u8",
        ElrondU16: "u16",
        ElrondU32: "u32",
        ElrondU64: "u64",
        TokenIdentifier: "EgldOrEsdtTokenIdentifier",
        TokenPayment: "EgldOrEsdtTokenPayment"
    }

    constructor(
        public buildInfo: AbiBuildInfo,
        public name: string,
        public init: AbiConstructor,
        public endpoints: AbiEndpoint[],
        public events: AbiEvent[],
        public hasCallback: boolean,
        public types: { [key: string] : AbiEnumType | AbiStructType }
    ) {}

    intoJSON(): string {
        const newAbi = new Abi(this.buildInfo, this.name, this.parseConstructor(), this.endpoints.map(e => this.parseEndpoint(e)), this.events, this.hasCallback, this.types);
        const abiObject = Object.assign({}, newAbi) as any

        abiObject.constructor = abiObject.init
        abiObject.init = undefined

        return JSON.stringify(abiObject, null, 4);
    }

    private transformAsTypeIntoRustType(asType: string): string {
        for (const key of Object.keys(Abi.asToRustTypesMap)) {
            const genericRegex = /(.+)<(.+)>/g
            const matches = genericRegex.exec(asType)
            if (matches !== null) {
                const mainType = asType.substring(0, asType.indexOf('<'))
                const parsedMainType = this.transformAsTypeIntoRustType(mainType)
                const genericsTypesRaw = asType.substring(asType.indexOf('<') + 1, asType.length - 1)
                const genericTypesRegex = /(\w+(?:<.+>)*)/g
                const typesMatches = genericsTypesRaw.matchAll(genericTypesRegex)
                let type = typesMatches.next()
                let parsedTypes: string[] = []
                while (!type.done) {
                    parsedTypes.push(this.transformAsTypeIntoRustType(type.value[0]))
                    type = typesMatches.next()
                }

                return `${parsedMainType}<${parsedTypes.join(', ')}>`
            } else {
                if (asType === key) {
                    return Abi.asToRustTypesMap[key]
                }
            }
        }

        return asType
    }

    private parseEndpointsInputs(inputs: AbiEndpointInput[]): AbiEndpointInput[] {
        return inputs.map((value, index) => {
            const newType = this.transformAsTypeIntoRustType(value.type)

            return new AbiEndpointInput(
                value.name,
                newType
            )
        })
    }

    private parseEndpointsOutputs(outputs: AbiEndpointOutput[]): AbiEndpointOutput[] {
        return outputs
            .filter(e => e.type !== "void")
            .map((value, index) => {
                const newType = this.transformAsTypeIntoRustType(value.type)

                return new AbiEndpointOutput(
                    newType
                )
            })
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
            endpoint.mutability,
            endpoint.payableInTokens,
            this.parseEndpointsInputs(endpoint.inputs),
            this.parseEndpointsOutputs(endpoint.outputs),
        )
    }

}
