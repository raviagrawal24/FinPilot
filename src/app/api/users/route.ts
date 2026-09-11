import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getActiveUser } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getActiveUser(request);
    if (!user) {
      return NextResponse.json({ error: "No user found." }, { status: 444 });
    }
    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch active user." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            email,
            name,
            password,
            monthlyIncome,
        } = body;

        if (!email || !name) {
            return NextResponse.json(
                {
                    error: "email and name are required",
                },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    error: "A user with this email already exists",
                },
                { status: 409 }
            );
        }

        const passwordHash = password
            ? await bcrypt.hash(password, 12)
            : null;

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                monthlyIncome:
                    monthlyIncome !== undefined
                        ? Number(monthlyIncome)
                        : undefined,
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

        return NextResponse.json(
            {
                success: true,
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/users error:", error);

        return NextResponse.json(
            {
                error: "Failed to create user",
            },
            { status: 500 }
        );
    }
}