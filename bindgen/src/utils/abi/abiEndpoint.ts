import {AbiEndpointInput} from "./abiEndpointInput";
import {AbiEndpointOutput} from "./abiEndpointOutput";
import {AbiEndpointMutability} from "./abiEndpointMutability";

export class AbiEndpoint {

    constructor(
       public name: string,
       public mutability: AbiEndpointMutability,
       public payableInTokens: string[],
       public inputs: AbiEndpointInput[],
       public outputs: AbiEndpointOutput[]
    ) {}

}
