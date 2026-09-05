// Anonymous session handling shared between the main tracker and the guess
// pages. A session is just an unguessable token issued by the backend; progress
// is tracked server-side against it, so we only persist the token + expiry here.

export interface SessionInfo {
  token: string;
  expiresAt: number;
}

const STORAGE_KEY = "cet:session";

export function readSession(): SessionInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionInfo;
    if (!parsed || typeof parsed.token !== "string" || typeof parsed.expiresAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(info: SessionInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    /* storage is optional */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage is optional */
  }
}

export async function createSession(): Promise<SessionInfo> {
  const res = await fetch("/api/cet/session", { method: "POST" });
  if (!res.ok) throw new Error("Unable to start a session");
  const data = (await res.json()) as { token: string; expiresAt: number };
  const info: SessionInfo = { token: data.token, expiresAt: data.expiresAt };
  storeSession(info);
  return info;
}

// Returns a live session, creating a new one if none exists or the stored one
// has already expired.
export async function ensureSession(): Promise<SessionInfo> {
  const existing = readSession();
  if (existing && existing.expiresAt > Date.now()) return existing;
  return createSession();
}
