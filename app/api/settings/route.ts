import { NextResponse } from "next/server";

import { getCurrencyCode, setCurrencyCode } from "@/app/lib/store";

export async function GET() {
  const currency = await getCurrencyCode();
  return NextResponse.json({ currency });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { currency?: string };
    const currency = await setCurrencyCode(body.currency ?? "USD");
    return NextResponse.json({ currency });
  } catch {
    return NextResponse.json({ error: "Unable to update currency." }, { status: 500 });
  }
}
