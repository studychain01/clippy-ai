// Chat.tsx
import { useState, useEffect, useRef } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
};

export default function Chat() {
  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptStyle, setPromptStyle] = useState<"Balanced" | "Brief">(
    "Balanced"
  );
  const [copiedNotice, setCopiedNotice] = useState(false);

  // (optional) sessionId if you want multi-chat later
  const [sessionId] = useState(() => Date.now().toString());

  // Refs
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // --- Effects ---
  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("clippy.messages.v1");
    if (saved) setMessages(JSON.parse(saved));

    const savedStyle = localStorage.getItem("clippy.promptStyle.v1");
    if (savedStyle === "Balanced" || savedStyle === "Brief") {
      setPromptStyle(savedStyle);
    }
  }, []);

  useEffect(() => {
    // Save messages whenever they change
    localStorage.setItem("clippy.messages.v1", JSON.stringify(messages));
    // Auto scroll
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Save style whenever it changes
    localStorage.setItem("clippy.promptStyle.v1", promptStyle);
  }, [promptStyle]);

  // --- Handlers ---
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
  }

  function handleSubmit() {
    if (!inputText.trim() || loading) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    // placeholder: later you’ll call runCommandOrChat(inputText)
  }

  // --- UI ---
  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <h2>Clippy AI</h2>
        <select
          value={promptStyle}
          onChange={(e) =>
            setPromptStyle(e.target.value as "Balanced" | "Brief")
          }
        >
          <option value="Balanced">Balanced</option>
          <option value="Brief">Brief</option>
        </select>
        <button onClick={() => setMessages([])}>Clear</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.role}`}
          >
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
        {loading && <div className="message assistant">…thinking…</div>}
        {error && <div className="error">Error: {error}</div>}
        <div ref={listEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          value={inputText}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Type your message…"
        />
        <button onClick={handleSubmit} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
