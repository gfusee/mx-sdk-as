import {getContractPathByName} from "./utils/contractsPaths"
import {execCustom} from "./utils/exec"

async function runMandosTestAtPath(projectPath: string) {
    let mandosExecutable: string = '$HOME/elrondsdk/vmtools/mandos-test'

    try {
        await execCustom('which mandos-test')
        mandosExecutable = 'mandos-test'
    } catch (e) {}

    try {
        const mandosResult = await execCustom(`${mandosExecutable} mandos`, {cwd: projectPath})
        console.log(mandosResult.stdout)
    } catch (e) {
        console.log(e)
        throw e
    }
}

describe('test if mandos tests pass', () => {
    test('adder', async() => {
        const contractPath = getContractPathByName('adder')

        await runMandosTestAtPath(contractPath)
    })

    test('crowdfunding-esdt', async() => {
        const contractPath = getContractPathByName('crowdfunding-esdt')

        await runMandosTestAtPath(contractPath)
    })

    test('crypto-bubbles', async() => {
        const contractPath = getContractPathByName('crypto-bubbles')

        await runMandosTestAtPath(contractPath)
    })

    test('digital-cash', async() => {
        const contractPath = getContractPathByName('digital-cash')

        await runMandosTestAtPath(contractPath)
    })

    test('egld-esdt-swap', async() => {
        const contractPath = getContractPathByName('egld-esdt-swap')

        await runMandosTestAtPath(contractPath)
    })

    test('empty', async() => {
        const contractPath = getContractPathByName('empty')

        await runMandosTestAtPath(contractPath)
    })

    test('esdt-transfer-with-fee', async() => {
        const contractPath = getContractPathByName('esdt-transfer-with-fee')

        await runMandosTestAtPath(contractPath)
    })

    test('factorial', async() => {
        const contractPath = getContractPathByName('factorial')

        await runMandosTestAtPath(contractPath)
    })

    test('flip', async() => {
        const contractPath = getContractPathByName('flip')

        await runMandosTestAtPath(contractPath)
    })

    test('forwarder/adder', async() => {
        const contractPath = getContractPathByName('forwarder/adder')

        await runMandosTestAtPath(contractPath)
    })

    test('forwarder/lottery-esdt', async() => {
        const contractPath = getContractPathByName('forwarder/lottery-esdt')

        await runMandosTestAtPath(contractPath)
    })

    test('lottery-esdt', async() => {
        const contractPath = getContractPathByName('lottery-esdt')

        await runMandosTestAtPath(contractPath)
    })

    test('order-book/pair', async() => {
        const contractPath = getContractPathByName('order-book/pair')

        await runMandosTestAtPath(contractPath)
    })

    test('ping-pong-egld', async() => {
        const contractPath = getContractPathByName('ping-pong-egld')

        await runMandosTestAtPath(contractPath)
    })
})
