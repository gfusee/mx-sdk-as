import {AbiBuildInfo} from "./abiBuildInfo.js";
import {AbiConstructor} from "./abiConstructor.js";
import {AbiEndpoint} from "./abiEndpoint.js";
import {AbiEvent} from "./abiEvent.js";
import {AbiEnumType} from "./abiEnumType.js";
import {AbiStructType} from "./abiStructType.js";

export class Abi {

    constructor(
        public buildInfo: AbiBuildInfo,
        public name: string,
        public init: AbiConstructor,
        public endpoints: AbiEndpoint[],
        public events: AbiEvent[],
        public hasCallback: boolean,
        public types: { [key: string] : AbiEnumType | AbiStructType }
    ) {}

}
