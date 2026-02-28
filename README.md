# OpenKlaus Agent

A minimal, lite version clone of [OpenClaw](https://openclaw.ai/) — the personal AI assistant that actually does things. This project recreates the core architecture behind OpenClaw: an autonomous agent loop that can execute shell commands, persist conversation context, and connect to chat platforms like Telegram.

Built on the OpenAI `responses` API, it demonstrates how to:

- Run an autonomous tool-calling loop where the model can act repeatedly until it produces a final answer
- Execute shell commands on your machine via function calling
- Persist conversation history for multi-turn context
- Serve the agent over a REST API and Telegram bot simultaneously
- Enforce safety guardrails for destructive operations

## Project Structure

```bash
.
├── package.json        # Project metadata and dependencies
├── pnpm-lock.yaml      # Lockfile (pnpm)
├── src
│   ├── index.ts            # Express server + bot startup
│   ├── agent.ts            # Core agent loop using the Responses API
│   ├── client
│   │   └── index.ts        # OpenAI client configuration
│   ├── integrations
│   │   └── telegram.ts     # Telegram bot integration
│   ├── prompts
│   │   └── index.ts        # System prompt used by the agent
│   ├── schema
│   │   └── response.ts     # Zod schema for model responses
│   └── tools
│       ├── functions.ts    # Implementation of local tools
│       └── schemas.ts      # Tool definitions passed to the model
```

## How It Works

1. A message arrives via **REST API** (`POST /message`) or **Telegram bot**.
2. The server retrieves or creates a conversation history and appends the user message.
3. The **Responses API** is called with:
   - `model: "gpt-5.1"`
   - `tools: toolsDefinitions` (currently just `executeCommand`)
   - `text.format` set via `zodTextFormat(ResponseSchema, "response_schema")` so the model returns a structured payload.
4. The model can either:
   - Return a final `response_schema` object , or
   - Emit one or more **function calls** (tool invocations).
5. For each function call, the local `functions` map is used to execute the call, and the outputs are appended to `messages` as `function_call_output` entries.
6. The loop continues until there are no more tool calls and a valid `response_schema` is returned.
7. The final response is persisted in the conversation history and returned to the client.

Both transports (REST and Telegram) share the same `agent()` function — the agent logic is completely decoupled from how messages arrive.

## Requirements

- **Node.js** 22+ (recommended)
- **pnpm**, `npm`, or `yarn` for dependency management
- An **OpenAI API key** with access to the specified model (default: `gpt-5.1`).

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**

   Create a `.env` file in the project root:

   ```bash
   OPENAI_API_KEY=your_api_key_here
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token  # optional
   ```

   To get a Telegram bot token, message [@BotFather](https://t.me/BotFather) on Telegram and create a new bot. If the token is not set, only the REST API will run.

3. **Run the agent**

   ```bash
   # Development (with file watching)
   pnpm dev

   # Production
   pnpm start
   ```

4. **Send a message**

   Via REST API:
   ```bash
   curl -X POST http://localhost:3000/message \
     -H "Content-Type: application/json" \
     -d '{"message": "What files are in the current directory?", "conversationId": "chat-1"}'
   ```

   Via Telegram: just message your bot directly in the Telegram app.

## Customizing the Agent

You can adapt this starter in several ways:

- **Change the system behavior** by editing `src/prompts/index.ts`.
- **Add new tools** by:
  1. Implementing them in `src/tools/functions.ts`.
  2. Registering them in `src/tools/schemas.ts` with appropriate parameter schemas.
- **Adjust the response format** by editing `src/schema/response.ts` and corresponding usage in `agent.ts`.
- **Modify the loop behavior** in `src/agent.ts` (e.g., add a max-iteration limit, logging, or different stopping criteria).
- **Add new integrations** by creating a new file in `src/integrations/` following the pattern in `telegram.ts`.

## Safety Notes

The sample `executeCommand` tool executes arbitrary shell commands via `execSync`. The system prompt instructs the agent to ask for user confirmation before destructive operations (`rm`, `kill`, `DROP`, `git push --force`, etc.), but this is prompt-level enforcement only:

- Never expose this agent directly to untrusted user input without strong sandboxing.
- Review and constrain which commands may be executed.

## License

ISC
