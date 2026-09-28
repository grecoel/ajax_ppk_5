import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/session";

function registerRedirect(request: Request, error?: string) {
  const target = new URL(error ? "/register?error=" + error : "/dashboard", request.url);
  return NextResponse.redirect(target, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (
    name.length < 1 ||
    name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 200
  ) {
    return registerRedirect(request, "invalid");
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)",
      [id, name, email, passwordHash],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return registerRedirect(request, "exists");
    }
    throw error;
  }

  await createSession(id);
  return registerRedirect(request);
}
