import { NextResponse } from "next/server";

const allowedPageSizes = ["5", "10", "20"];

export async function POST(request: Request) {
  const form = await request.formData();
  const pageSize = String(form.get("pageSize") ?? "");
  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);

  if (allowedPageSizes.includes(pageSize)) {
    response.cookies.set("transaction_page_size", pageSize, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
