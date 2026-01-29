import { useMemo, useState } from "react";
import "./App.css";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
};

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hey! Send a message to start the chat." },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading],
  );
  const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8787";

  function getSessionId() {
    const key = "cf_ai_sessionId";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    setError(null);
    setIsLoading(true);

    // 1) Show user message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    // 2) Fake an "AI" reply (for now)
    // This is just to prove the UI flow works.
    try {
      const sessionId = getSessionId();

      const resp = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData?.error || `Request failed: ${resp.status}`);
      }

      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginBottom: 12 }}>Cloudflare Memory Chat</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "10px 12px",
              borderRadius: 12,
              background: m.role === "user" ? "#005eff" : "#1f1f1f",
              whiteSpace: "pre-wrap",
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>
              {m.role === "user" ? "You" : "Assistant"}
            </strong>
            {m.content}
          </div>
        ))}

        {isLoading && (
          <div style={{ alignSelf: "flex-start", opacity: 0.7 }}>
            <em>Thinking…</em>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 10, color: "crimson" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
          }}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
