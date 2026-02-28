import type OpenAI from "openai";

export const toolsDefinitions = [
    {
        type: "function",
        name: "executeCommand",
        description: "Execute a command in the terminal",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description: "Command to execute"
                }
            },
            required: ["command"],
            additionalProperties: false
        }
    }
] satisfies OpenAI.Responses.Tool[];
