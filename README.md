# OpenClaw Agent

OpenClaw Agent is a minimal autonomous AI agent runner built on top of the OpenAI `responses` API. It is designed as a small, hackable starter that shows how to:

- Configure and call the OpenAI Responses API from a Node/TypeScript project
- Define a system prompt and response schema using Zod
- Expose and invoke tools (functions) from the model
- Run an autonomous loop where the model can call tools repeatedly until it produces a final answer
- Serve the agent over a REST API with conversation persistence

This repository is intentionally small and focused so you can easily adapt it to your own workflows.

## Project Structure

```bash
.
├── package.json        # Project metadata and dependencies
├── pnpm-lock.yaml      # Lockfile (pnpm)
├── src
│   ├── index.ts        # Express server with conversation management
│   ├── agent.ts        # Core agent loop using the Responses API
│   ├── client
│   │   └── index.ts    # OpenAI client configuration
│   ├── prompts
│   │   └── index.ts    # System prompt used by the agent
│   ├── schema
│   │   └── response.ts # Zod schema for model responses
│   └── tools
│       ├── functions.ts# Implementation of local tools │       └── schemas.ts  # Tool definitions passed to the model
```

## How It Works

1. A `POST /message` request arrives with a `message` and optional `conversationId`.
2. The server retrieves or creates a conversation history and appends the user message.
3. The **Responses API** is called with:
   - `model: "gpt-5.1"`
   - `tools: toolsDefinitions` (currently just `executeCommand`)
   - `text.format` set via `zodTextFormat(ResponseSchema, "response_schema")` so the model returns a structured payload.
4. The model can either:
   - Return a final `response_schema` object (with `text` and `finalMessage`), or
   - Emit one or more **function calls** (tool invocations).
5. For each function call, the local `functions` map is used to execute the call, and the outputs are appended to `messages` as `function_call_output` entries.
6. The loop continues until there are no more tool calls and a valid `response_schema` is returned.
7. The final response is persisted in the conversation history and returned to the client.

This pattern gives you a straightforward autonomous agent loop that can iteratively observe, act (via tools), and reason.

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
   ```

3. **Run the agent**

   ```bash
   # Development (with file watching)
   pnpm dev

   # Production
   pnpm start
   ```

4. **Send a message**

   ```bash
   curl -X POST http://localhost:3000/message \
     -H "Content-Type: application/json" \
     -d '{"message": "What files are in the current directory?", "conversationId": "chat-1"}'
   ```

## Customizing the Agent

You can adapt this starter in several ways:

- **Change the system behavior** by editing `src/prompts/index.ts`.
- **Add new tools** by:
  1. Implementing them in `src/tools/functions.ts`.
  2. Registering them in `src/tools/schemas.ts` with appropriate parameter schemas.
- **Adjust the response format** by editing `src/schema/response.ts` and corresponding usage in `agent.ts`.
- **Modify the loop behavior** in `src/agent.ts` (e.g., add a max-iteration limit, logging, or different stopping criteria).

## Safety Notes

The sample `executeCommand` tool executes arbitrary shell commands via `execSync`. The system prompt instructs the agent to ask for user confirmation before destructive operations (`rm`, `kill`, `DROP`, `git push --force`, etc.), but this is prompt-level enforcement only:

- Never expose this agent directly to untrusted user input without strong sandboxing.
- Review and constrain which commands may be executed.

## License

ISC
