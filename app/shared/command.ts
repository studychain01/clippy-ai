/**
 * COMMAND ROUTER (pure logic)
 * - Parses user input and decides action:
 *    1) "open website <url|query>" -> window.os.openExternal(...)
 *    2) "summarize clipboard"      -> text = window.os.readClipboard() -> LLM summarize
 *    3) "calc <expr>"               -> evaluate via math lib (safe)
 *    4) otherwise                   -> LLM chat (general Q&A)
 *
 * Exports:
 *   runCommandOrChat(input: string, ctx: {
 *     system: string,                    // prompt style text
 *     history: {role, content}[]         // recent messages (for context)
 *   }) => Promise<string>                // returns assistant reply/plain string
 *
 * NOTE: This module should not import React/Electron.
 * It is UI-agnostic and easy to unit test.
 */
