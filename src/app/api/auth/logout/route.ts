import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/logout error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log out." },
      { status: 500 }
    );
  }
}
