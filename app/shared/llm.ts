/**
 * LLM PROVIDER INTERFACE
 * - Single function 'chat' that calls your model API (OpenAI or compatible)
 * - Keeps vendor details isolated (URLs, headers, model name)
 *
 * Exports:
 *   chat(system: string, messages: {role: 'system'|'user'|'assistant', content: string}[])
 *     => Promise<string>  // returns text content
 *
 * ENV VARS (set via .env):
 *   VITE_OPENAI_API_KEY
 *   VITE_OPENAI_MODEL (e.g., 'gpt-4o-mini')
 */

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  modelOverride?: string;
}

export interface LLMProvider {
  chat(messages: LLMMessage[], options?: ChatOptions): Promise<string>;
}

// Environment variables
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
const DEFAULT_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || "gpt-4o-mini";

const API_URL = "https://api.openai.com/v1/chat/completions";

// Guard to ensure API key is present
function assertApiKey() {
  if (!API_KEY) {
    throw new Error(
      "Missing VITE_OPENAI_API_KEY. Add it to your .env file (see .env.example)."
    );
  }
}

/**
 * Main chat function that calls OpenAI API
 * @param system - system prompt for the AI
 * @param messages - conversation history
 * @param opts - optional parameters (temperature, maxTokens, etc.)
 */
export async function chat(
  system: string,
  messages: LLMMessage[],
  opts: ChatOptions = {}
): Promise<string> {
  assertApiKey();

  const model = opts.modelOverride || DEFAULT_MODEL;
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens;

  // Prepare messages for OpenAI API
  const payloadMessages: LLMMessage[] = [
    ...(system ? [{ role: "system" as const, content: system }] : []),
    ...messages,
  ];

  // Setup abort controller for timeout
  const controller = opts.signal instanceof AbortSignal ? null : new AbortController();
  const signal = opts.signal || controller?.signal;

  const timeoutMs = 60_000; // 60 seconds
  const timeoutId = controller && setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: payloadMessages,
      }),
      signal,
    });

    if (!response.ok) {
      let detail = "";
      try {
        const json = await response.json();
        detail = json?.error?.message || JSON.stringify(json);
      } catch {
        detail = await response.text();
      }
      throw new Error(
        `OpenAI ${response.status} ${response.statusText}${detail ? ` – ${detail}` : ""}`
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? "";

    if (typeof text !== "string" || text.trim() === "") {
      throw new Error("Empty response from model.");
    }

    return text.trim();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Simple one-shot prompt helper
 */
export async function oneShot(
  system: string,
  userText: string,
  opts?: ChatOptions
): Promise<string> {
  return chat(system, [{ role: "user", content: userText }], opts);
}
