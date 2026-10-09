import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";

import { apiGoogleLogin, apiLogin, apiRegister } from "../auth/apiAuth.js";
import { showAlert } from "../utils/showAlert.js";
import LoginSuccessBurst from "./LoginSuccessBurst.jsx";

import styles from "./Login.module.css";

/** @typedef {"user" | "analyst" | "admin"} AccountRole */

/** @param {{ onLogin: (session: { role: AccountRole; email: string; token?: string }) => void }} props */
export default function Login({ onLogin }) {
  const [authMode, setAuthMode] = useState(/** @type {"login" | "register"} */ ("login"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState(/** @type {AccountRole} */ ("user"));
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  /** @type {React.MutableRefObject<{ role: AccountRole; email: string; token?: string } | null>} */
  const pendingSessionRef = useRef(null);

  const heroImageSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return `${normalized}bclog.jpg`;
  }, []);
  const appleIconSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return `${normalized}apple.png`;
  }, []);
  const googleIconSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.endsWith("/") ? base : `${base}/`;
    return `${normalized}google.png`;
  }, []);

  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const celebratingRef = useRef(false);
  celebratingRef.current = celebrating;

  const finishGoogleSession = useCallback(async (idToken) => {
    if (celebratingRef.current) return;
    try {
      window.google?.accounts?.id?.cancel?.();
    } catch {
      /* ignore */
    }
    document
      .querySelectorAll(
        'iframe[src*="accounts.google.com"], iframe[src*="google.com/gsi"], #credential_picker_container, [id^="gsi_"]',
      )
      .forEach((el) => el.remove());
    setBusy(true);
    try {
      const res = await apiGoogleLogin(idToken);
      if (!res.ok) {
        showAlert("Could not log in with Google", res.message);
        return;
      }
      pendingSessionRef.current = { role: res.role, email: res.email, token: res.token };
      setBurstKey((k) => k + 1);
      setCelebrating(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showAlert("Could not log in with Google", message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!googleClientId) return undefined;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response?.credential) {
            try {
              window.google.accounts.id.cancel();
            } catch {
              /* ignore */
            }
            void finishGoogleSession(response.credential);
          }
        },
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false,
      });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        shape: "pill",
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [finishGoogleSession, googleClientId]);

  const handleBurstComplete = useCallback(() => {
    const session = pendingSessionRef.current;
    pendingSessionRef.current = null;
    setCelebrating(false);
    if (session != null) {
      onLogin(session);
    }
  }, [onLogin]);

  const openAppleLogin = useCallback(() => {
    showAlert("Apple Sign-In", "Apple Sign-In is not configured yet. Use email login or Google.");
  }, []);

  const submit = async () => {
    if (busy || celebrating) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showAlert("Missing email", "Enter your email address.");
      return;
    }
    if (!password) {
      showAlert("Missing password", "Enter your password.");
      return;
    }

    setBusy(true);
    try {
      if (authMode === "login") {
        const res = await apiLogin(trimmedEmail, password);
        if (!res.ok) {
          showAlert("Could not log in", res.message);
          return;
        }
        setBusy(false);
        pendingSessionRef.current = { role: res.role, email: res.email, token: res.token };
        setBurstKey((k) => k + 1);
        setCelebrating(true);
        return;
      }

      const res = await apiRegister(trimmedEmail, password, confirmPassword, registerRole);
      if (!res.ok) {
        showAlert("Could not create account", res.message);
        return;
      }
      onLogin({ role: res.role, email: res.email, token: res.token });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showAlert("Something went wrong", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* Hero: <img> so the photo always paints (CSS bg can be dropped by tooling order). */}
        <div className={styles.hero}>
          <img className={styles.heroPhoto} src={heroImageSrc} alt="" decoding="async" fetchPriority="high" />
          <div className={styles.heroOverlay} aria-hidden />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>Welcome to PhishGuard</h1>
            <p className={styles.subtitle}>
              {authMode === "login"
                ? "Log in with the email you registered."
                : "Create an account and choose User, Analyst, or Admin once."}
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.formInner}>
            <div className={styles.chipRow}>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className={`${styles.chip} ${authMode === "login" ? styles.chipActive : styles.chipInactive}`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className={`${styles.chip} ${authMode === "register" ? styles.chipActive : styles.chipInactive}`}
              >
                Register
              </button>
            </div>

            <form
              className={styles.formStack}
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />

              <input
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />

              {authMode === "register" ? (
                <div className={styles.registerBlock}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                  />
                  <p className={styles.fieldLabel}>Account type (saved to this email)</p>
                  <div className={styles.roleRow}>
                    {(
                      /** @type {const} */ ([
                        ["user", "User"],
                        ["analyst", "Analyst"],
                        ["admin", "Admin"],
                      ])
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRegisterRole(key)}
                        className={`${styles.roleChip} ${registerRole === key ? styles.roleChipOn : ""}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={styles.hint}>
                    After registration, you always log in as this role. Users: Dashboard, Scanner, Chatbot, Learning Center, Reports. Analysts:
                    also Dataset, Quality, Logs. Admins: also User Management.
                  </p>
                </div>
              ) : null}

              <button type="submit" disabled={busy || celebrating} className={styles.primaryBtn}>
                {busy ? "Please wait…" : celebrating ? "…" : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            <div className={styles.dividerRow}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerOr}>or</span>
              <div className={styles.dividerLine} />
            </div>

            <button type="button" className={styles.optionBtn} onClick={openAppleLogin}>
              <img src={appleIconSrc} alt="" className={styles.optionIcon} aria-hidden />
              <span>Login with Apple</span>
            </button>
            {googleClientId ? (
              <div ref={googleBtnRef} className={styles.googleBtnWrap} />
            ) : (
              <button
                type="button"
                className={styles.optionBtn}
                onClick={() =>
                  showAlert(
                    "Google Sign-In is not configured",
                    "Create a Google Cloud OAuth Web client, then set VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env (same client ID). Restart both apps.",
                  )
                }
              >
                <img src={googleIconSrc} alt="" className={styles.optionIcon} aria-hidden />
                <span>Login with Google</span>
              </button>
            )}

            <p className={styles.more}>Show more options</p>

            <p className={styles.legal}>
              By continuing, you agree to service terms and security notifications. Accounts are stored on the PhishGuard
              API server (MongoDB).
            </p>
          </div>
        </div>
      </div>

      {celebrating ? (
        <LoginSuccessBurst key={burstKey} onComplete={handleBurstComplete} />
      ) : null}
    </div>
  );
}
