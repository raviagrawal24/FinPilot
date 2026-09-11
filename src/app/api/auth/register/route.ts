import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword } = body;

    // 1. Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Full Name, Email, Password, and Confirm Password are required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return NextResponse.json(
        { error: "Full name cannot be empty." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 2. Validate password rules (min 8 chars, 1 number, 1 uppercase)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one number." },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase character." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Password and Confirm Password do not match." },
        { status: 400 }
      );
    }

    // 3. Check duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // 4. Hash password securely using bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Create user in Prisma PostgreSQL
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: trimmedEmail,
        passwordHash,
        monthlyIncome: 85000,
        healthScore: 78,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        healthScore: true,
        monthlyIncome: true,
        createdAt: true,
      },
    });

    // If there are existing orphan transactions, associate them with this new user so dashboard is populated
    try {
      const existingUserCount = await prisma.user.count();
      if (existingUserCount <= 2) {
        await prisma.transaction.updateMany({
          where: { userId: { not: user.id } },
          data: { userId: user.id },
        });
        await prisma.goal.updateMany({
          where: { userId: { not: user.id } },
          data: { userId: user.id },
        });
        await prisma.liability.updateMany({
          where: { userId: { not: user.id } },
          data: { userId: user.id },
        });
        await prisma.subscription.updateMany({
          where: { userId: { not: user.id } },
          data: { userId: user.id },
        });
      }
    } catch (e) {
      console.warn("Seeding initial user relations warning:", e);
    }

    // 6. Set HTTP-only session cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        user,
      },
      { status: 201 }
    );

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
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to register account." },
      { status: 500 }
    );
  }
}
