import { useEffect, useState } from "react";

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;
  if (raw) return String(raw).replace(/\/api\/?$/i, "").replace(/\/$/, "");
  return "http://localhost:5000";
}

export default function MobileGoogleHandoff() {
  const [message, setMessage] = useState("Choose your Google account to finish signing in on the phone.");
  const [done, setDone] = useState(false);
  const sessionId = new URLSearchParams(window.location.search).get("session") || "";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!sessionId || !googleClientId || done) return undefined;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const host = document.getElementById("mobile-google-btn");
      if (!window.google?.accounts?.id || !host) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          const idToken = response?.credential || "";
          if (!idToken) {
            setMessage("Google did not return a sign-in token.");
            return;
          }
          try {
            const res = await fetch(`${apiBase()}/api/auth/google/mobile-handoff/${sessionId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success !== true) {
              setMessage(data.message || "Google sign-in failed.");
              return;
            }
            setDone(true);
            setMessage("Signed in. You can close this window and return to the phone.");
          } catch {
            setMessage("Could not reach the API. Make sure the server is running.");
          }
        },
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
      host.innerHTML = "";
      window.google.accounts.id.renderButton(host, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "pill",
      });
      window.google.accounts.id.prompt();
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [done, googleClientId, sessionId]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", padding: 24 }}>
      <div style={{ width: "min(420px, 100%)", background: "white", borderRadius: 16, padding: 28, boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#0f172a" }}>Phone sign-in</h1>
        <p style={{ margin: "0 0 20px", color: "#475569", lineHeight: 1.5 }}>{message}</p>
        {!sessionId ? <p style={{ color: "#b91c1c" }}>Missing sign-in session. Start again from the phone.</p> : null}
        {!done && sessionId ? <div id="mobile-google-btn" /> : null}
      </div>
    </div>
  );
}
