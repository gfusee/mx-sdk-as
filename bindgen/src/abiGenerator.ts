//@ts-nocheck
import {AbiStructType} from "./utils/abi/abiStructType.js";
import {AbiEnumType} from "./utils/abi/abiEnumType.js";
import {AbiEndpoint} from "./utils/abi/abiEndpoint.js";
import {AbiConstructor} from "./utils/abi/abiConstructor.js";
import {Abi, Types} from "./utils/abi/abi.js"
import {AbiBuildInfo} from "./utils/abi/abiBuildInfo.js";

export class ABIExporter {

    static generateABI(
        userStructs: { [key: string] : AbiStructType}[],
        userEnums: { [key: string] : AbiEnumType}[],
        contractConstructor: AbiConstructor,
        contractEndpoints: AbiEndpoint[]
    ): Abi {

        const typesConcat = (userStructs as Types[])
            .concat(userEnums)

        let types: Types = {}

        for (const type of typesConcat) {
            types = Object.assign(types, type)
        }

        return new Abi(
            new AbiBuildInfo(),
            "Contract",
            contractConstructor,
            contractEndpoints,
            [],
            false,
            types
        )

    }

}
