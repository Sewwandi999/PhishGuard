const EVENT = "phishguard:phishing";

export function looksLikePhishingVerdict(text) {
  const value = String(text || "");
  return /verdict:\s*phishing|looks like a phishing|phishing detected|isphishing/i.test(value);
}

export function enablePhishingNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve("unsupported");
  }
  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }
  if (Notification.permission === "denied") {
    return Promise.resolve("denied");
  }
  return Notification.requestPermission();
}

export async function notifyPhishing({ title, body, preview }) {
  const detail = {
    title: title || "Phishing alert",
    body: body || "A phishing message or email was detected.",
    preview: preview || "",
    at: Date.now(),
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail }));
  }

  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(detail.title, {
        body: detail.body,
        tag: "phishguard-phishing",
      });
    } catch {
      // Some browsers block Notification from non-secure contexts.
    }
  }
}

export function subscribePhishingAlerts(handler) {
  const listener = (event) => handler(event.detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
