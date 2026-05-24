import { NextResponse } from "next/server";

export async function GET() {
  const available = !!process.env.METAAPI_TOKEN;
  return NextResponse.json({ available });
}
