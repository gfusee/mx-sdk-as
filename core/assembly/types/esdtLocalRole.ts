export enum ESDTLocalRoleFlag {
    NONE = 0b00000000,
    MINT = 0b00000001,
    BURN = 0b00000010,
    NFT_CREATE = 0b00000100,
    NFT_ADD_QUANTITY = 0b00001000,
    NFT_BURN = 0b00010000,
    NFT_ADD_URI = 0b00100000,
    NFT_UPDATE_ATTRIBUTES = 0b01000000,
    TRANSFER = 0b10000000
}

export class ESDTLocalRole {

    constructor(
        public value: u64
    ) {}

    hasRole(role: ESDTLocalRoleFlag): bool {
        return (this.value & role) !== ESDTLocalRoleFlag.NONE
    }

}