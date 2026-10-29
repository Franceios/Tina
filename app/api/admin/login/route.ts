import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, createAdminSessionToken, getAdminCredentials } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password?.trim();

    let credentials;
    try {
      credentials = getAdminCredentials();
    } catch {
      return NextResponse.json(
        { error: "Admin credentials are not configured on the server." },
        { status: 503 },
      );
    }

    if (username === credentials.username && password === credentials.password) {
      const token = createAdminSessionToken();
      const response = NextResponse.json({ ok: true, user: credentials.username });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });

      return response;
    }

    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  } catch {
    return NextResponse.json({ error: "Request could not be processed." }, { status: 400 });
  }
}
