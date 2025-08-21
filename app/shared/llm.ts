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
