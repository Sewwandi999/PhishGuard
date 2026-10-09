function apiBase() {
  const raw = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;
  if (raw) {
    return String(raw).replace(/\/api\/?$/i, "").replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

export async function sendChatMessage(text) {
  const message = text.trim();
  if (!message) {
    return { ok: false, message: "Please type a message." };
  }

  let res;
  try {
    res = await fetch(`${apiBase()}/api/chatbot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    return { ok: false, message: "Cannot reach chatbot API server." };
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    return { ok: false, message: data.message || "Chatbot request failed." };
  }
  return { ok: true, reply: data.reply || "No reply returned." };
}
