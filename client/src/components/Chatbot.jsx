import React, { useState } from "react";
import { Bot, SendHorizontal, User } from "lucide-react";

import { sendChatMessage } from "../api/chatbotApi.js";
import { looksLikePhishingVerdict, notifyPhishing } from "../utils/notifyPhishing.js";
import { showAlert } from "../utils/showAlert.js";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I am your phishing assistant. Paste a suspicious text, link, or email content and I will help you review it.",
    },
  ]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMessage = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true);

    const res = await sendChatMessage(text);
    setBusy(false);

    if (!res.ok) {
      showAlert("Chatbot request failed", res.message);
      return;
    }

    setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: "bot", text: res.reply }]);
    if (looksLikePhishingVerdict(res.reply)) {
      void notifyPhishing({
        title: "Phishing email/SMS detected",
        body: "The chatbot flagged this content as phishing. Avoid links and credentials.",
        preview: text.slice(0, 120),
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl text-slate-900">Security Chatbot</h1>
        <p className="text-slate-600 mt-1">Ask phishing-related questions and check suspicious messages instantly.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="h-[62vh] overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
                  m.role === "user"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-900 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  <span className="text-xs opacity-80">{m.role === "user" ? "You" : "PhishGuard Bot"}</span>
                </div>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              </div>
            </div>
          ))}
          {busy ? <p className="text-sm text-slate-500">Bot is typing...</p> : null}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-3"
              placeholder="Type your phishing question or paste message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage()}
              disabled={busy || !input.trim()}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-lg disabled:opacity-60"
            >
              <SendHorizontal className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
