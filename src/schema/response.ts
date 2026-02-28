import { z } from "zod";

export const ResponseSchema = z.object({
    text: z.string().describe("Text response"),
    finalMessage: z.boolean()
});
