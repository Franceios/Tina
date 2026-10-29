import { NextResponse } from "next/server";

const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "@123Basil";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password?.trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return NextResponse.json({
        token: "tinnah-admin-session-token",
        user: ADMIN_USERNAME,
      });
    }

    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  } catch {
    return NextResponse.json({ error: "Request could not be processed." }, { status: 400 });
  }
}
