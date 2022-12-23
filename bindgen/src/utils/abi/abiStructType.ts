import {AbiType} from "./abiType.js";
import {AbiStructTypeField} from "./abiStructTypeField";

export class AbiStructType {

    type: AbiType

    constructor(
        public fields: AbiStructTypeField[]
    ) {
        this.type = AbiType.STRUCT
    }

}
