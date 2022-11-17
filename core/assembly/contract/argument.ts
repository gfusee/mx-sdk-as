import { getNumArguments } from "../utils/env";

export class ArgumentApi {

    static getNumberOfArguments(): i32 {
        return getNumArguments()
    }

}