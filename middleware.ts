import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const url = req.nextUrl;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  if (url.pathname === "/") {
    if (isMobile) {
      return NextResponse.redirect(new URL("/mobile", req.url));
    } else {
      return NextResponse.redirect(new URL("/desktop", req.url));
    }
  }

  return NextResponse.next();
}

