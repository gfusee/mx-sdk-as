import {getContractPathByName} from "./utils/contractsPaths"
import {execCustom} from "./utils/exec"

async function runScenariosTestAtPath(projectPath: string) {
    let runScenariosExecutable: string = '$HOME/multiversx-sdk/vmtools/run-scenarios'

    try {
        await execCustom('which run-scenarios')
        runScenariosExecutable = 'run-scenarios'
    } catch (e) {}

    try {
        const scenariosResult = await execCustom(`${runScenariosExecutable} scenarios`, {cwd: projectPath})
        console.log(scenariosResult.stdout)
    } catch (e) {
        console.log(e)
        throw e
    }
}

describe('test if scenarios tests pass', () => {
    test('adder', async() => {
        const contractPath = getContractPathByName('adder')

        await runScenariosTestAtPath(contractPath)
    })

    test('crowdfunding-esdt', async() => {
        const contractPath = getContractPathByName('crowdfunding-esdt')

        await runScenariosTestAtPath(contractPath)
    })

    test('crypto-bubbles', async() => {
        const contractPath = getContractPathByName('crypto-bubbles')

        await runScenariosTestAtPath(contractPath)
    })

    test('digital-cash', async() => {
        const contractPath = getContractPathByName('digital-cash')

        await runScenariosTestAtPath(contractPath)
    })

    test('egld-esdt-swap', async() => {
        const contractPath = getContractPathByName('egld-esdt-swap')

        await runScenariosTestAtPath(contractPath)
    })

    test('empty', async() => {
        const contractPath = getContractPathByName('empty')

        await runScenariosTestAtPath(contractPath)
    })

    test('esdt-transfer-with-fee', async() => {
        const contractPath = getContractPathByName('esdt-transfer-with-fee')

        await runScenariosTestAtPath(contractPath)
    })

    test('factorial', async() => {
        const contractPath = getContractPathByName('factorial')

        await runScenariosTestAtPath(contractPath)
    })

    test('flip', async() => {
        const contractPath = getContractPathByName('flip')

        await runScenariosTestAtPath(contractPath)
    })

    test('forwarder/adder', async() => {
        const contractPath = getContractPathByName('forwarder/adder')

        await runScenariosTestAtPath(contractPath)
    })

    test('forwarder/lottery-esdt', async() => {
        const contractPath = getContractPathByName('forwarder/lottery-esdt')

        await runScenariosTestAtPath(contractPath)
    })

    test('lottery-esdt', async() => {
        const contractPath = getContractPathByName('lottery-esdt')

        await runScenariosTestAtPath(contractPath)
    })

    test('order-book/pair', async() => {
        const contractPath = getContractPathByName('order-book/pair')

        await runScenariosTestAtPath(contractPath)
    })

    test('ping-pong-egld', async() => {
        const contractPath = getContractPathByName('ping-pong-egld')

        await runScenariosTestAtPath(contractPath)
    })
})
