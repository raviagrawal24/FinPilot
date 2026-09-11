import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/expenses",
  "/cashflow",
  "/goals",
  "/liabilities",
  "/subscriptions",
  "/alerts",
  "/assistant",
  "/simulator",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("finpilot_session")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If user tries to access protected route without auth session, redirect to /login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and visits /login or /register, redirect to /dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/expenses/:path*",
    "/cashflow/:path*",
    "/goals/:path*",
    "/liabilities/:path*",
    "/subscriptions/:path*",
    "/alerts/:path*",
    "/assistant/:path*",
    "/simulator/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
