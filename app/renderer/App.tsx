/**
 * ROOT REACT COMPONENT
 * - Provides the app layout and ties together:
 *    • Message state (from store)
 *    • Prompt style (brief/balanced) selector
 *    • <MessageList /> and <InputBar />
 * - Calls the command router on submit and updates state.
 * - Persists messages via store (localStorage).
 *
 * High-level flow:
 *   onSubmit(text) -> runCommandOrChat(text, {style, history}) -> result
 *   -> append assistant reply -> persist
 */

import React from "react";
import Chat from "./components/Chat";

function App() {
    return (
        <div>
            <Chat />
        </div>
    );
}

export default App;