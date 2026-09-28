import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { findUserByEmail } from "@/lib/auth";

function loginRedirect(request: Request, error?: string) {
  const target = new URL(error ? "/login?error=" + error : "/dashboard", request.url);
  return NextResponse.redirect(target, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password || password.length > 200) {
    return loginRedirect(request, "invalid");
  }

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return loginRedirect(request, "invalid");
  }

  await createSession(user.id);
  return loginRedirect(request);
}
