import {AbiEndpointInput} from "./abiEndpointInput";
import {AbiEndpointOutput} from "./abiEndpointOutput";

export class AbiConstructor {

    constructor(
        public inputs: AbiEndpointInput[],
        public outputs: AbiEndpointOutput[]
    ) {}

}
