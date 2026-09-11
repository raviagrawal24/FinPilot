import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch user session." },
      { status: 500 }
    );
  }
}
