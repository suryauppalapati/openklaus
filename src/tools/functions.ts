import { execSync } from "child_process"

const executeCommand = ({ command }: { command: string }) => {
    const response = execSync(command)
    return response.toString()
}

export const functions = {
    executeCommand
}
