import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { sendChatMessage } from "./chatbotApi";
import { looksLikePhishingVerdict, notifyPhishing } from "./notifyPhishing";
import { showAlert } from "./showAlert";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
};

export default function ChatbotPage() {
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I am your phishing assistant. Paste a suspicious text, link, or email content and I will help you review it.",
    },
  ]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
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
      notifyPhishing(
        "Phishing email/SMS detected",
        "The chatbot flagged this content as phishing. Avoid links and credentials.",
      );
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Security Chatbot</Text>
      <Text style={styles.subtitle}>Ask phishing-related questions or paste suspicious messages for advice.</Text>

      <ScrollView style={styles.chatBox} contentContainerStyle={styles.chatContent}>
        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.role, m.role === "user" ? styles.roleUser : styles.roleBot]}>
              {m.role === "user" ? "You" : "PhishGuard Bot"}
            </Text>
            <Text style={[styles.message, m.role === "user" ? styles.messageUser : styles.messageBot]}>{m.text}</Text>
          </View>
        ))}
        {busy ? <Text style={styles.typing}>Bot is typing...</Text> : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          placeholderTextColor="#9ca3af"
          multiline
        />
        <Pressable style={[styles.sendBtn, (busy || !input.trim()) && styles.sendBtnDisabled]} onPress={() => void send()}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333333",
  },
  title: {
    color: "#fafafa",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#a3a3a3",
    marginTop: 4,
    marginBottom: 12,
  },
  chatBox: {
    backgroundColor: "#111214",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#2f2f31",
    maxHeight: 420,
  },
  chatContent: {
    padding: 10,
    gap: 8,
  },
  bubble: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: "90%",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: "#27272a",
  },
  role: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: "700",
  },
  roleUser: {
    color: "#dbeafe",
  },
  roleBot: {
    color: "#c4b5fd",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageUser: {
    color: "#ffffff",
  },
  messageBot: {
    color: "#e5e7eb",
  },
  typing: {
    color: "#9ca3af",
    marginTop: 4,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 54,
    maxHeight: 120,
    backgroundColor: "#262626",
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fafafa",
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
});
