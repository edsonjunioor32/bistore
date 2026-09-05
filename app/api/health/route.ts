import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    service: "bistore",
    status: "ok",
    architecture: "multi-tenant",
  });
}
