// Chat.tsx
import { useState, useEffect, useRef } from "react";
import { chat, LLMMessage } from "../../shared/llm";
import "./Chat.css";

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

  async function handleSubmit() {ƒ
    if (!inputText.trim() || loading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText,
      ts: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);
    setError(null);

    try {
      // Convert chat messages to LLM format
      const llmMessages: LLMMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      llmMessages.push({
        role: "user",
        content: userMessage.content
      });

      // Create system prompt based on style
      const systemPrompt = promptStyle === "Brief" 
        ? "You are a helpful assistant. Keep your responses concise and to the point."
        : "You are a helpful assistant. Provide thoughtful and detailed responses.";

      // Get AI response
      const aiResponse = await chat(systemPrompt, llmMessages, {
        temperature: 0.7,
        maxTokens: 1000
      });

      // Add AI response to messages
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        ts: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setError(err.message || "Something went wrong with the AI response.");
    } finally {
      setLoading(false);
    }
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
