import { apiBase } from "./auth/accounts";

export async function sendChatMessage(text: string): Promise<{ ok: true; reply: string } | { ok: false; message: string }> {
  const message = text.trim();
  if (!message) return { ok: false, message: "Please type a message." };

  let res: Response;
  try {
    res = await fetch(`${apiBase()}/api/chatbot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
  } catch {
    return { ok: false, message: "Cannot reach chatbot API server." };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || data.success !== true) {
    return { ok: false, message: typeof data.message === "string" ? data.message : "Chatbot request failed." };
  }

  return { ok: true, reply: typeof data.reply === "string" ? data.reply : "No reply returned." };
}
