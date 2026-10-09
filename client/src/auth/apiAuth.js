/**
 * Auth against Express + MongoDB (`/api/auth/*`).
 * Base URL: `VITE_API_URL` (e.g. http://localhost:5000) — no trailing `/api`.
 */

function apiBase() {
  const raw = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;
  if (raw) {
    return String(raw).replace(/\/api\/?$/i, "").replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

async function readJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/** @typedef {"user" | "analyst" | "admin"} AccountRole */

/**
 * @param {unknown} value
 * @returns {AccountRole}
 */
function normalizeRole(value) {
  const role = String(value || "").toLowerCase();
  if (role === "admin" || role === "analyst" || role === "user") return role;
  return "user";
}

/**
 * @param {string} email
 * @param {string} password
 */
export async function apiLogin(email, password) {
  const base = apiBase();
  let res;
  try {
    res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    return { ok: false, message: "Cannot reach the server. Is it running and is VITE_API_URL correct?" };
  }
  const data = await readJson(res);
  if (!res.ok || !data.success) {
    return { ok: false, message: data.message || "Login failed" };
  }
  const role = normalizeRole(data.user?.role);
  return {
    ok: true,
    email: data.user.email,
    role,
    token: data.token,
  };
}

export function displayNameFromEmail(email) {
  const local = email.trim().split("@")[0];
  return local || "User";
}

/**
 * @param {string} email
 * @param {string} password
 * @param {string} confirmPassword
 * @param {AccountRole} role
 */
export async function apiRegister(email, password, confirmPassword, role) {
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
  let res;
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
    return { ok: false, message: "Cannot reach the server. Is it running and is VITE_API_URL correct?" };
  }
  const data = await readJson(res);
  if (!res.ok || !data.success) {
    return { ok: false, message: data.message || "Registration failed" };
  }
  const r = normalizeRole(data.user?.role);
  return {
    ok: true,
    email: data.user.email,
    role: r,
    token: data.token,
  };
}

/**
 * @param {string} idToken
 */
export async function apiGoogleLogin(idToken) {
  if (!idToken) {
    return { ok: false, message: "Missing Google sign-in token." };
  }
  const base = apiBase();
  let res;
  try {
    res = await fetch(`${base}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    return { ok: false, message: "Cannot reach the server. Is it running and is VITE_API_URL correct?" };
  }
  const data = await readJson(res);
  if (!res.ok || !data.success) {
    return { ok: false, message: data.message || "Google login failed" };
  }
  return {
    ok: true,
    email: data.user.email,
    role: normalizeRole(data.user?.role),
    token: data.token,
  };
}
