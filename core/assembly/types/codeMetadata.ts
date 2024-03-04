import {ManagedU16} from "./numbers";

export enum CodeMetadataFlag {
    DEFAULT = 0,
    UPGRADEABLE = 0b0000_0001_0000_0000, // LSB of first byte
    READABLE = 0b0000_0100_0000_0000, // 3rd LSB of first byte
    PAYABLE = 0b0000_0000_0000_0010, // 2nd LSB of second byte
    PAYABLE_BY_SC = 0b0000_0000_0000_0100 // 3rd LSB of second byte
}

export class CodeMetadata {

    value: ManagedU16

    constructor(
        upgradeable: boolean,
        readable: boolean,
        payable: boolean,
        payableBySc: boolean,
    ) {
        let result = CodeMetadataFlag.DEFAULT

        if (upgradeable) {
            result &= CodeMetadataFlag.UPGRADEABLE
        }

        if (readable) {
            result &= CodeMetadataFlag.READABLE
        }

        if (payable) {
            result &= CodeMetadataFlag.PAYABLE
        }

        if (payableBySc) {
            result &= CodeMetadataFlag.PAYABLE_BY_SC
        }

        this.value = result
    }

}
