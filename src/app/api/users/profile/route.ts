import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    // Get currently authenticated user from session cookie
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required to update profile." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name cannot be empty." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already belongs to another user
    if (cleanEmail !== authUser.email.toLowerCase()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingUser && existingUser.id !== authUser.id) {
        return NextResponse.json(
          { error: "A user with this email address is already registered." },
          { status: 409 }
        );
      }
    }

    // Update user record in Prisma PostgreSQL
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        name: cleanName,
        email: cleanEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        healthScore: true,
        monthlyIncome: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update profile information." },
      { status: 500 }
    );
  }
}
