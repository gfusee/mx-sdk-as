import * as fs from "fs/promises"
import path from "path"
import {getContractPathByName} from "./utils/contractsPaths"
import {execCustom} from "./utils/exec"

async function compareAbisAtPath(projectPath: string) {
    const generatedPathSuffixes = ["build", "release.abi.json"]
    const expectedPathSuffixes = ["test", "expected.abi.json"]
    const generatedJson = JSON.parse(await fs.readFile(path.join(projectPath, ...generatedPathSuffixes), { encoding: "utf8" }))
    const expectedJson = JSON.parse(await fs.readFile(path.join(projectPath, ...expectedPathSuffixes), { encoding: "utf8" }))

    expect(generatedJson).toEqual(expectedJson)
}

describe('test if abis are correctly generated', () => {
    test('test adder abi', async() => {
        const contractPath = getContractPathByName('adder')

        await compareAbisAtPath(contractPath)
    })

    test('test crowdfunding-esdt abi', async () => {
        const contractPath = getContractPathByName('crowdfunding-esdt')

        await compareAbisAtPath(contractPath)
    })

    test('test crypto-bubbles abi', async () => {
        const contractPath = getContractPathByName('crypto-bubbles')

        await compareAbisAtPath(contractPath)
    })

    test('test digital-cash abi', async () => {
        const contractPath = getContractPathByName('digital-cash')

        await compareAbisAtPath(contractPath)
    })

    test('test egld-esdt-swap abi', async () => {
        const contractPath = getContractPathByName('egld-esdt-swap')

        await compareAbisAtPath(contractPath)
    })

    test('test empty abi', async () => {
        const contractPath = getContractPathByName('empty')

        await compareAbisAtPath(contractPath)
    })

    test('test esdt-transfer-with-fee abi', async () => {
        const contractPath = getContractPathByName('esdt-transfer-with-fee')

        await compareAbisAtPath(contractPath)
    })

    test('test factorial abi', async () => {
        const contractPath = getContractPathByName('factorial')

        await compareAbisAtPath(contractPath)
    })

    test('test forwarder/adder abi', async () => {
        const contractPath = getContractPathByName('forwarder/adder')

        await compareAbisAtPath(contractPath)
    })

    test('test forwarder/lottery-esdt abi', async () => {
        const contractPath = getContractPathByName('forwarder/lottery-esdt')

        await compareAbisAtPath(contractPath)
    })

    test('test lottery-esdt abi', async () => {
        const contractPath = getContractPathByName('lottery-esdt')

        await compareAbisAtPath(contractPath)
    })

    test('test order-book/pair abi', async () => {
        const contractPath = getContractPathByName('order-book/pair')

        await compareAbisAtPath(contractPath)
    })

    test('test ping-pong-egld abi', async () => {
        const contractPath = getContractPathByName('ping-pong-egld')

        await compareAbisAtPath(contractPath)
    })
})
