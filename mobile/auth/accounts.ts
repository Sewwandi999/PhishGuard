import Constants from "expo-constants";
import { Platform } from "react-native";

/** Stored on MongoDB via Express API. */
export type AccountRole = "user" | "analyst" | "admin";

/** Phone builds cannot reach the PC through localhost, so use the Expo dev-server host. */
export function apiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  let base = "";
  if (fromEnv && typeof fromEnv === "string") {
    base = fromEnv.replace(/\/$/, "");
  } else if (__DEV__ && Platform.OS === "android") {
    base = "http://10.0.2.2:5000";
  } else {
    base = "http://localhost:5000";
  }

  const debuggerHost = Constants.expoConfig?.hostUri || "";
  const lanHost = debuggerHost.split(":")[0];
  if (lanHost && /\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/.test(base)) {
    base = base.replace("localhost", lanHost).replace("127.0.0.1", lanHost);
  }
  return base;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

function displayNameFromEmail(email: string): string {
  const local = email.trim().split("@")[0];
  return local || "User";
}

function normalizeRole(value: unknown): AccountRole {
  if (value === "admin" || value === "analyst" || value === "user") return value;
  return "user";
}

/**
 * Register via API (same MongoDB as web).
 */
export async function registerAccount(
  email: string,
  password: string,
  confirmPassword: string,
  role: AccountRole,
): Promise<{ ok: true; email: string; role: AccountRole } | { ok: false; message: string }> {
  const e = email.trim().toLowerCase();
  if (!e || !e.includes("@")) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { ok: false, message: "Password and confirmation do not match." };
  }

  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: displayNameFromEmail(e),
        email: e,
        password,
        role: role || "user",
      }),
    });
  } catch {
    return {
      ok: false,
      message: "Cannot reach the server. Set EXPO_PUBLIC_API_URL to your machine IP:5000 (e.g. http://192.168.1.5:5000) and ensure the API is running.",
    };
  }

  const data = await readJson(res);
  const success = data.success === true;
  if (!res.ok || !success) {
    const msg = typeof data.message === "string" ? data.message : "Registration failed";
    return { ok: false, message: msg };
  }

  const user = data.user as Record<string, unknown> | undefined;
  const emailOut = typeof user?.email === "string" ? user.email : e;
  return { ok: true, email: emailOut, role: normalizeRole(user?.role) };
}

/**
 * Log in via API (same MongoDB as web).
 */
export async function loginAccount(
  email: string,
  password: string,
): Promise<{ ok: true; email: string; role: AccountRole } | { ok: false; message: string }> {
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    return {
      ok: false,
      message: "Cannot reach the server. Set EXPO_PUBLIC_API_URL to your machine IP:5000 and ensure the API is running.",
    };
  }

  const data = await readJson(res);
  const success = data.success === true;
  if (!res.ok || !success) {
    const msg = typeof data.message === "string" ? data.message : "Login failed";
    return { ok: false, message: msg };
  }

  const user = data.user as Record<string, unknown> | undefined;
  const e = email.trim().toLowerCase();
  const emailOut = typeof user?.email === "string" ? user.email : e;
  return { ok: true, email: emailOut, role: normalizeRole(user?.role) };
}

export async function beginGoogleHandoff(): Promise<
  { ok: true; sessionId: string } | { ok: false; message: string }
> {
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/google/mobile-handoff/start`, {
      method: "POST",
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return { ok: false, message: "Cannot reach the server. Make sure the API is running on this computer." };
  }
  const data = await readJson(res);
  if (!res.ok || data.success !== true || typeof data.sessionId !== "string") {
    return { ok: false, message: typeof data.message === "string" ? data.message : "Could not start Google sign-in." };
  }
  return { ok: true, sessionId: data.sessionId };
}

export async function waitForGoogleHandoff(
  sessionId: string,
): Promise<{ ok: true; email: string; role: AccountRole } | { ok: false; message: string }> {
  const base = apiBase();
  const started = Date.now();
  while (Date.now() - started < 3 * 60 * 1000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    let res: Response;
    try {
      res = await fetch(`${base}/api/auth/google/mobile-handoff/${sessionId}`);
    } catch {
      return { ok: false, message: "Cannot reach the server." };
    }
    const data = await readJson(res);
    if (data.status === "pending") continue;
    if (data.status === "error") {
      return { ok: false, message: typeof data.message === "string" ? data.message : "Google sign-in failed." };
    }
    if (res.ok && data.status === "complete") {
      const googleUser = data.user as Record<string, unknown> | undefined;
      const emailOut = typeof googleUser?.email === "string" ? googleUser.email : "";
      return { ok: true, email: emailOut, role: normalizeRole(googleUser?.role) };
    }
    if (!res.ok) {
      return { ok: false, message: typeof data.message === "string" ? data.message : "Google sign-in expired." };
    }
  }
  return { ok: false, message: "Google sign-in timed out. Try again." };
}

export async function loginWithGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<{ ok: true; email: string; role: AccountRole } | { ok: false; message: string }> {
  if (!code || !codeVerifier) {
    return { ok: false, message: "Google did not return a sign-in code." };
  }
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/google/mobile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, codeVerifier }),
    });
  } catch {
    return {
      ok: false,
      message: "Cannot reach the server. Set EXPO_PUBLIC_API_URL and ensure the API is running.",
    };
  }
  const data = await readJson(res);
  if (!res.ok || data.success !== true) {
    const msg = typeof data.message === "string" ? data.message : "Google login failed";
    return { ok: false, message: msg };
  }
  const googleUser = data.user as Record<string, unknown> | undefined;
  const emailOut = typeof googleUser?.email === "string" ? googleUser.email : "";
  return { ok: true, email: emailOut, role: normalizeRole(googleUser?.role) };
}

export async function loginWithGoogle(
  idToken: string,
): Promise<{ ok: true; email: string; role: AccountRole } | { ok: false; message: string }> {
  if (!idToken) {
    return { ok: false, message: "Missing Google sign-in token." };
  }
  const base = apiBase();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    return {
      ok: false,
      message: "Cannot reach the server. Set EXPO_PUBLIC_API_URL and ensure the API is running.",
    };
  }
  const data = await readJson(res);
  if (!res.ok || data.success !== true) {
    const msg = typeof data.message === "string" ? data.message : "Google login failed";
    return { ok: false, message: msg };
  }
  const googleUser = data.user as Record<string, unknown> | undefined;
  const emailOut = typeof googleUser?.email === "string" ? googleUser.email : "";
  return { ok: true, email: emailOut, role: normalizeRole(googleUser?.role) };
}
