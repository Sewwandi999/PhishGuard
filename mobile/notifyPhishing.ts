import { Platform } from "react-native";

import { showAlert } from "./showAlert";

export function looksLikePhishingVerdict(text: string): boolean {
  return /verdict:\s*phishing|looks like a phishing|phishing detected|isphishing/i.test(text || "");
}

export function notifyPhishing(title: string, body: string): void {
  showAlert(title, body);
  if (Platform.OS === "web" && typeof Notification !== "undefined") {
    const show = () => {
      try {
        new Notification(title, { body, tag: "phishguard-phishing" });
      } catch {
        // Ignore browsers that block the Notification constructor.
      }
    };
    if (Notification.permission === "granted") {
      show();
      return;
    }
    if (Notification.permission === "default") {
      void Notification.requestPermission().then((status) => {
        if (status === "granted") show();
      });
    }
  }
}
