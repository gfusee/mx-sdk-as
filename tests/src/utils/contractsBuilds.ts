import {getContractsExamplesPaths} from "./contractsPaths"
import {execCustom} from "./exec"

class BuildRunner {

    installFulfilled: boolean = false
    buildFulfilled: boolean = false
    failed: boolean = false

    promise: Promise<void>

    constructor(
        public path: string
    ) {
        this.promise = this.run()
    }

    private async run() {
        try {
            await installContract(this.path)
            this.installFulfilled = true

            await buildContract(this.path)
            this.buildFulfilled = true
        } catch (e) {
            this.failed = true
        }
    }

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export async function resetContractsBuilds() {
    const contractsExamplesPaths = await getContractsExamplesPaths()
    for (const contractExamplePath of contractsExamplesPaths) {
        await execCustom('rm -rf build && rm -rf node_modules', {cwd: contractExamplePath})
    }
}

export async function buildAllContracts() {
    const contractsExamplesPaths = await getContractsExamplesPaths()
    const buildsRunners = contractsExamplesPaths.map((path) => new BuildRunner(path))

    let lastBuildProgress = -1

    while (buildsRunners.filter(e => !e.buildFulfilled).length > 0) {
        const totalBuildProgress = buildsRunners
            .reduce(
                (previousValue, currentValue) => {
                 let currentProgress = 0

                 currentProgress += currentValue.installFulfilled ? 1 : 0
                 currentProgress += currentValue.buildFulfilled ? 1 : 0

                 return previousValue + currentProgress
                },
                0
            )

        if (totalBuildProgress > lastBuildProgress) {
            logBuildsStates(buildsRunners)
            lastBuildProgress = totalBuildProgress
        }

        await sleep(1000)
    }

    logBuildsStates(buildsRunners)
    console.log('✅ All contracts built ! ✅')
}

async function installContract(path: string): Promise<void> {
    await execCustom('npm i', {cwd: path})
}

async function buildContract(path: string): Promise<void> {
    await execCustom('npm run asbuild', {cwd: path})
}

function logBuildsStates(runners: BuildRunner[]) {
    let log = '----- CURRENTLY BUILDING -----\n'

    for (const runner of runners) {
        const examplesSearchString = 'contracts/examples/'
        const examplesSearchStringIndex = runner.path.indexOf(examplesSearchString)
        const contractName = runner.path.substring(examplesSearchStringIndex + examplesSearchString.length)
        const status = runner.installFulfilled ? (runner.buildFulfilled ? '✅' : 'Building ⏳') : 'Installing node_modules ⏳'

        if (runner.failed) {
            throw `❌ Building contract ${contractName} failed ❌`
        }

        log += `${contractName} : ${status}\n`
    }

    console.log(log)
}
