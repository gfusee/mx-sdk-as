import path from "path"
import appRoot from "app-root-path"
import {execCustom} from "./exec"

const excludedContracts = [
    "crypto-kitties/common/kitty",
    "crypto-kitties/common/random",
    "crypto-kitties/kitty-genetic-alg",
    "crypto-kitties/kitty-ownership",
    "order-book/factory"
]

export async function getContractsExamplesPaths(): Promise<string[]> {
    const examplesPath = path.join(path.resolve(appRoot.path, '..'), 'contracts', 'examples')

    return getContractsSubpaths(examplesPath)
}

export function getContractPathByName(name: string): string {
    return path.join(path.resolve(appRoot.path, '..'), 'contracts', 'examples', name)
}

async function getContractsSubpaths(basePath: string): Promise<string[]> {
    const ls = (await execCustom('ls', { cwd: basePath } )).stdout.trim()

    let results: string[] = []

    if (ls.includes("package.json")) {
        results.push(basePath)
    } else {
        const lsFolders = (await execCustom('ls -d */ | cut -f1 -d\'/\'', { cwd: basePath } )).stdout.trim()
        const folders = lsFolders.split('\n').map(e => path.join(basePath, e))

        for (const folder of folders) {
            results.push(...await getContractsSubpaths(folder))
        }
    }

    return results
        .filter(e => {
            for (const excluded of excludedContracts) {
                if (e.endsWith(excluded)) {
                    return false
                }
            }

            return true
        })
}
