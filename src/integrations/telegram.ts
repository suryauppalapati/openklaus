import TelegramBot from "node-telegram-bot-api";
import openKlausAgent from "../agent.ts";
import { SYSTEM_PROMPT } from "../prompts/index.ts";

const conversations = new Map<string, any[]>();

export const startTelegramBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.log("TELEGRAM_BOT_TOKEN not set, skipping Telegram bot.");
        return;
    }

    const bot = new TelegramBot(token, { polling: true });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id.toString();
        const text = msg.text;

        console.log("MSG", text);


        if (!text) return;

        if (!conversations.has(chatId)) {
            conversations.set(chatId, [
                { role: "system", content: SYSTEM_PROMPT },
            ]);
        }

        const messages = conversations.get(chatId)!;
        messages.push({ role: "user", content: text });

        try {
            const response = await openKlausAgent(messages);
            await bot.sendMessage(msg.chat.id, response);
        } catch (error: any) {
            console.error("Agent error:", error);
            await bot.sendMessage(msg.chat.id, "Something went wrong. Please try again.");
        }
    });

    console.log("Telegram bot started.");
};
