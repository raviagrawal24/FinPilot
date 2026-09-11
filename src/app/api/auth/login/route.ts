import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email address and password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Find user in Prisma PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    // 2. Verify password hash using bcryptjs
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    // 3. Create HTTP-only session cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        healthScore: user.healthScore,
        monthlyIncome: user.monthlyIncome,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log in." },
      { status: 500 }
    );
  }
}
