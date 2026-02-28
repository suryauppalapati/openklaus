import { zodTextFormat } from "openai/helpers/zod";
import openai from "./client/index.ts";
import { ResponseSchema } from "./schema/response.ts";
import { toolsDefinitions } from "./tools/schemas.ts";
import { functions } from "./tools/functions.ts";

const agent = async (messages: any[]) => {
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

        // If no tool calls are present, consider it as final answer, return it
        if (toolCalls.length === 0 && response.output_parsed) {
            messages.push({ role: "assistant", content: response.output_parsed.text });
            return response.output_parsed.text;
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
    }
}

export default agent;
