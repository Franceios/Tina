import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/app/lib/auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
