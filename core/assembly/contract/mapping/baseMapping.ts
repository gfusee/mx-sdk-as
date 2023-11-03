import {StorageKey} from "../../types";

@unmanaged
export class BaseMapping {

    constructor(
        protected key: StorageKey
    ) {}

}
