import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "./db";

const cookieName = process.env.SESSION_COOKIE_NAME || "expense_session";
const sessionDurationSeconds = 60 * 60 * 24 * 7;

export async function createSession(userId: string): Promise<void> {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + sessionDurationSeconds * 1000);
  await pool.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, userId, expiresAt],
  );

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(cookieName)?.value;
  if (!sessionId) return null;

  const result = await pool.query<{ user_id: string }>(
    "SELECT user_id FROM sessions WHERE id = $1 AND expires_at > NOW()",
    [sessionId],
  );
  return result.rows[0]?.user_id ?? null;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(cookieName)?.value;
  if (sessionId) {
    await pool.query("DELETE FROM sessions WHERE id = $1", [sessionId]);
  }
  cookieStore.delete(cookieName);
}
