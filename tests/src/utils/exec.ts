import {ExecException, ExecOptions} from "child_process"
import { exec } from "child_process"

type ExecError = {
    error: ExecException,
    stdout: string,
    stderr: string
}

export function execCustom(
    command: string,
    options?: ExecOptions
): Promise<{stdout: string, stderr: string}> {
    return new Promise((resolve, reject) => {
        exec(command, options,(error, stdout, stderr) => {
            if (error) {
                const thrownError: ExecError = {
                    error: error,
                    stdout: stdout,
                    stderr: stderr
                }
                reject(thrownError)
            } else {
                resolve({
                    stdout: stdout,
                    stderr: stderr
                })
            }
        })
    })

}
