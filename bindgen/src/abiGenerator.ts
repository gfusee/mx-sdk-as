//@ts-nocheck
import {AbiStructType} from "./utils/abi/abiStructType.js";
import {AbiEnumType} from "./utils/abi/abiEnumType.js";
import {AbiEndpoint} from "./utils/abi/abiEndpoint.js";
import {AbiConstructor} from "./utils/abi/abiConstructor.js";
import {Abi} from "./utils/abi/abi.js";
import {AbiBuildInfo} from "./utils/abi/abiBuildInfo.js";

export class ABIExporter {

    static generateABI(
        userStructs: { [key: string] : AbiStructType}[],
        userEnums: { [key: string] : AbiEnumType}[],
        contractConstructor: AbiConstructor,
        contractEndpoints: AbiEndpoint[]
    ): Abi {

        const types = (userStructs as { [key: string] : AbiStructType})
            .concat(userEnums)

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
