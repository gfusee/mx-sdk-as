import {buildAllContracts, resetContractsBuilds} from "./utils/contractsBuilds"

module.exports = async () => {
    await resetContractsBuilds()
    await buildAllContracts()
}
