import { pool } from "./db";
import { getSessionUserId } from "./session";
import type { SafeUser } from "./types";

export async function getCurrentUser(): Promise<SafeUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const result = await pool.query<SafeUser>(
    "SELECT id, name, email FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string) {
  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
    password_hash: string;
  }>("SELECT id, name, email, password_hash FROM users WHERE email = $1", [email]);
  return result.rows[0] ?? null;
}
