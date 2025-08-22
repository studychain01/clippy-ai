// Chat.tsx
import { useState, useEffect, useRef } from "react";
import { LLMMessage } from "../../shared/llm";
import { CommandProcessor } from "../../shared/command";
import ReactMarkdown from 'react-markdown';
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
  const [promptStyle, setPromptStyle] = useState<"Balanced" | "Brief" | "Creative" | "Professional">(
    "Balanced"
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // (optional) sessionId if you want multi-chat later
  const [sessionId] = useState(() => Date.now().toString());

  // Refs
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Command processor
  const [commandProcessor] = useState(() => new CommandProcessor());

  // --- Effects ---
  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("clippy.messages.v1");
    if (saved) setMessages(JSON.parse(saved));

    const savedStyle = localStorage.getItem("clippy.promptStyle.v1");
    if (savedStyle === "Balanced" || savedStyle === "Brief" || savedStyle === "Creative" || savedStyle === "Professional") {
      setPromptStyle(savedStyle);
    }

    const savedMinimized = localStorage.getItem("clippy.isMinimized.v1");
    if (savedMinimized === "true") {
      setIsMinimized(true);
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

  useEffect(() => {
    // Save minimized state whenever it changes
    localStorage.setItem("clippy.isMinimized.v1", isMinimized.toString());
  }, [isMinimized]);

  // --- Handlers ---
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
  }

  async function toggleMinimized() {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    // If running in Electron, also resize the actual window
    if ((window as any).electronAPI) {
      try {
        if (newMinimizedState) {
          await (window as any).electronAPI.minimizeWindow();
        } else {
          await (window as any).electronAPI.expandWindow();
        }
      } catch (error) {
        console.error('Failed to resize Electron window:', error);
      }
    }
  }

  async function handleSubmit() {
    console.log('handleSubmit called with inputText:', inputText);
    if (!inputText.trim() || loading) {
      console.log('Returning early - inputText empty or loading');
      return;
    }
    
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
      // Convert chat messages to LLM format for context
      const llmMessages: LLMMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create system prompt based on style
      let systemPrompt = "You are Clippy AI, a helpful desktop assistant.";
      switch (promptStyle) {
        case "Brief":
          systemPrompt += " Keep responses concise and to the point. Use markdown formatting when helpful.";
          break;
        case "Creative":
          systemPrompt += " Be creative, engaging, and use emojis. Make responses fun and interesting. Use markdown formatting when helpful.";
          break;
        case "Professional":
          systemPrompt += " Maintain a professional, formal tone. Provide comprehensive, well-structured responses. Use markdown formatting when helpful.";
          break;
        default: // Balanced
          systemPrompt += " Provide thoughtful and detailed responses. Use markdown formatting when helpful.";
      }

      // Use command processor to handle input (commands or chat)
      const aiResponse = await commandProcessor.runCommandOrChat(inputText, {
        system: systemPrompt,
        history: llmMessages
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
  // If minimized, show compact widget
  if (isMinimized) {
    return (
      <div className="chat-widget-compact" onClick={toggleMinimized}>
        <div className="widget-icon">💬</div>
        <div className="widget-text">Clippy AI</div>
      </div>
    );
  }

  // Full chat window
  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <h2>Clippy AI</h2>
        <select
          value={promptStyle}
          onChange={(e) =>
            setPromptStyle(e.target.value as "Balanced" | "Brief" | "Creative" | "Professional")
          }
        >
          <option value="Balanced">Balanced</option>
          <option value="Brief">Brief</option>
          <option value="Creative">Creative</option>
          <option value="Professional">Professional</option>
        </select>
        <button onClick={() => setMessages([])}>Clear</button>
        <button onClick={toggleMinimized}>−</button>
        <button onClick={async () => {
          const helpMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: "/help",
            ts: Date.now(),
          };
          setMessages(prev => [...prev, helpMessage]);
          
          const helpResponse = await commandProcessor.runCommandOrChat("/help", {
            system: "You are Clippy AI, a helpful desktop assistant.",
            history: []
          });
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: helpResponse,
            ts: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }}>Help</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message ${m.role}`}
          >
            <strong>{m.role}:</strong> 
            <div className="message-content">
              {m.role === "assistant" ? (
                <ReactMarkdown>{m.content}</ReactMarkdown>
              ) : (
                m.content
              )}
            </div>
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
        <button 
          onClick={() => {
            console.log('Send button clicked!');
            handleSubmit();
          }} 
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
