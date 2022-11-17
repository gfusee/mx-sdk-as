import {ElrondString, ElrondU32, ElrondU8} from "@gfusee/elrond-wasm-as";

const SEED_SIZE: u32 = 48
const SALT_SIZE: u32 = 32
const BYTE_MAX: u16 = u8.MAX_VALUE as u16 + 1

export class Random {

    private static _SEED_STATIC_BUFFER: Uint8Array | null = null
    private static _SALT_STATIC_BUFFER: Uint8Array | null = null

    private static get SEED_STATIC_BUFFER(): Uint8Array {
        if (Random._SEED_STATIC_BUFFER) {
            return Random._SEED_STATIC_BUFFER!
        } else {
            const buffer = new Uint8Array(SEED_SIZE)
            Random._SEED_STATIC_BUFFER = buffer

            return buffer
        }
    }

    private static get SALT_STATIC_BUFFER(): Uint8Array {
        if (Random._SALT_STATIC_BUFFER) {
            return Random._SALT_STATIC_BUFFER!
        } else {
            const buffer = new Uint8Array(SEED_SIZE)
            Random._SALT_STATIC_BUFFER = buffer

            return buffer
        }
    }

    constructor(
        public data: Uint8Array,
        public currentIndex: ElrondU32
    ) {
        if (data.length != SEED_SIZE) {
            throw new Error("Random's data property should have SEED_SIZE length")
        }
    }

    static new(
        seed: ElrondString, //TODO : implement something like ManagedArgBuffer?
        salt: ElrondString
    ): Random {

        const seedBytes = seed.utils.toBytes()
        const saltBytes = salt.utils.toBytes()

        if (seedBytes.length != SEED_SIZE) {
            throw new Error("Wrong seed bytes size")
        }

        if (saltBytes.length != SALT_SIZE) {
            throw new Error("Wrong salt bytes size")
        }

        Random.SEED_STATIC_BUFFER.set(seedBytes)
        Random.SALT_STATIC_BUFFER.set(saltBytes)

        const randSource = new Uint8Array(SEED_SIZE)

        for (let i: u32 = 0; i < SEED_SIZE; i++) {
            const seedByte = Random.SEED_STATIC_BUFFER[i]
            const saltByte = Random.SALT_STATIC_BUFFER[i % SALT_SIZE]
            const sum = (seedByte as u16) + (saltByte as u16)

            randSource[i] = (sum % BYTE_MAX) as u8
        }

        return new Random(
            randSource,
            ElrondU32.zero()
        )
    }

    nextU8(): ElrondU8 {
        const val = this.data[this.currentIndex.value]

        this.currentIndex += ElrondU32.fromValue(1)

        if (this.currentIndex == ElrondU32.fromValue(SEED_SIZE)) {
            this.shuffle()
            this.currentIndex = ElrondU32.zero()
        }

        return ElrondU8.fromValue(val)
    }

    nextU32(): ElrondU32 {
        const firstByte = this.nextU8().value as u32
        const secondByte = this.nextU8().value as u32
        const thirdByte = this.nextU8().value as u32
        const fourthByte = this.nextU8().value as u32

        // TODO: Fix, this only generates in u8 range (see elrond-wasm-rs)
        return ElrondU32.fromValue(
            firstByte | secondByte | thirdByte | fourthByte
        )
    }

    shuffle(): void {
        const forLoopLength = this.data.length - 1

        for (let i = 0; i < forLoopLength; i++) {
            const res: u16 = (this.data[i] as u16) + (this.data[i + 1] as u16) + 1

            this.data[i] = (res % (u8.MAX_VALUE as u16 + 1)) as u8
        }
    }
}