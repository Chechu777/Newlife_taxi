import { NextResponse } from "next/server";

export function middleware(req) {
  const ua = req.headers.get("user-agent") || "";
  const url = req.nextUrl;

  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);

  if (url.pathname === "/") {
    if (isMobile) {
      return NextResponse.redirect(new URL("/mobile", req.url));
    } else {
      return NextResponse.redirect(new URL("/desktop", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
