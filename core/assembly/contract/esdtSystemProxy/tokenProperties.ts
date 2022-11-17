import {ElrondU32} from "../../types";

export class TokenProperties {

    constructor(
       public numberOfDecimals: ElrondU32,
       public canFreeze: boolean,
       public canWipe: boolean,
       public canPause: boolean,
       public canMint: boolean,
       public canBurn: boolean,
       public canChangeOwner: boolean,
       public canUpgrade: boolean,
       public canAddSpecialRoles: boolean
    ) {}

}

export class FungibleTokenProperties extends TokenProperties {}