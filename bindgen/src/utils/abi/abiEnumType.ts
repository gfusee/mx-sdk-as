import {AbiEnumTypeVariant} from "./abiEnumTypeVariant.js";
import {AbiType} from "./abiType.js";

export class AbiEnumType {

    type: AbiType

    constructor(
        public variants: AbiEnumTypeVariant[]
    ) {
        this.type = AbiType.ENUM
    }

}
