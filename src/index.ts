import openai from "./client";
import { z } from "zod";
import { SYSTEM_PROMPT } from "./prompts";

const response = await openai.responses.parse({
    model: "gpt-4o-mini",
    messages: [
        {
            role: "system",
            content: SYSTEM_PROMPT
        }
    ]
})