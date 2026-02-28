import { zodTextFormat } from "openai/helpers/zod";
import openai from "./client/index.ts";
import { SYSTEM_PROMPT } from "./prompts/index.ts";
import { ResponseSchema } from "./schema/response.ts";
import { toolsDefinitions } from "./tools/schemas.ts";
import { functions } from "./tools/functions.ts";

type Role = "system" | "assistant" | "developer" | "user"

const messages = [
    {
        role: "system" as Role,
        content: SYSTEM_PROMPT
    },
    {
        role: "user" as Role,
        content: "go through the folder files of src and create a polished readme.md file in the root directory."
    }
];

const init = async () => {
    while (true) {
        const response = await openai.responses.parse({
            model: "gpt-5.1",
            tools: toolsDefinitions,
            input: messages,
            text: {
                format: zodTextFormat(ResponseSchema, "response_schema"),
            }
        });

        const toolCalls = response.output.filter(item => item.type === "function_call");

        if (toolCalls.length === 0 && response.output_parsed) {
            console.log("Assistant:", response.output_parsed.text);
            messages.push({
                "role": "assistant",
                content: response.output_parsed.text
            })
            break;
        }

        // Feed the function call inputs and outputs back as context
        const toolOutputs = toolCalls.map(toolCall => {
            if (toolCall.name in functions) {
                const fn = functions[toolCall.name as keyof typeof functions];
                const args = JSON.parse(toolCall.arguments);
                const result = fn(args);
                return {
                    type: "function_call_output" as const,
                    call_id: toolCall.call_id,
                    output: typeof result === "string" ? result : JSON.stringify(result),
                };
            }
            return null;
        }).filter(Boolean);

        const toolInputs = response.output.map((item: any) => {
            const { parsed_arguments, ...rest } = item;
            return rest;
        });
        messages.push(...toolInputs as any, ...toolOutputs as any);
        console.log(JSON.stringify(messages, null, 2));
    }

}

init().catch(console.error);
