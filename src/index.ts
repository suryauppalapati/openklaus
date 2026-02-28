import express from "express";
import openKlausAgent from "./agent.ts";
import { SYSTEM_PROMPT } from "./prompts/index.ts";
import { startTelegramBot } from "./integrations/telegram.ts";

const app = express();
app.use(express.json());

// In-memory conversation store
const conversations = new Map<string, any[]>();

app.post("/message", async (req, res) => {
    try {
        const { message, conversationId = "default" } = req.body;

        // Get or create conversation history
        if (!conversations.has(conversationId)) {
            conversations.set(conversationId, [
                { role: "system", content: SYSTEM_PROMPT },
            ]);
        }
        const messages = conversations.get(conversationId)!;
        messages.push({ role: "user", content: message });

        const response = await openKlausAgent(messages);

        res.json({ response, conversationId });
    } catch (error: any) {
        console.error("Agent error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});

// Start Telegram bot (if token is configured)
startTelegramBot();