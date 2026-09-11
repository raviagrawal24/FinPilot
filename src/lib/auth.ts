import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "finpilot_session";

export interface UserSessionData {
  id: string;
  email: string;
  name: string;
  healthScore: number;
  monthlyIncome: number;
  avatar: string | null;
  createdAt?: Date;
}

/**
 * Reads the authenticated user from the HTTP-only finpilot_session cookie.
 * Returns null if no valid session cookie is present or if the user record does not exist.
 */
export async function getCurrentUser(req?: NextRequest): Promise<UserSessionData | null> {
  try {
    let sessionToken: string | undefined = undefined;

    if (req) {
      sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      try {
        const cookieStore = await cookies();
        sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      } catch (e) {
        // Fallback if cookies() is called outside request context
      }
    }

    if (!sessionToken) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
      select: {
        id: true,
        email: true,
        name: true,
        healthScore: true,
        monthlyIncome: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      healthScore: user.healthScore ?? 78,
      monthlyIncome: user.monthlyIncome ?? 85000,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export const getAuthenticatedUser = getCurrentUser;

/**
 * Throws an error if no authenticated user is present.
 */
export async function requireCurrentUser(req?: NextRequest): Promise<UserSessionData> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

/**
 * Resolves target user for API endpoints.
 * First checks active session cookie, then query parameter if provided for admin/test, or returns null.
 */
export async function resolveTargetUser(request?: NextRequest, queryUserId?: string | null) {
  // 1. Session user (from HTTP-only cookie)
  const sessionUser = await getCurrentUser(request);
  if (sessionUser) {
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (dbUser) return dbUser;
  }

  // 2. If query parameter userId passed (and matches valid user in DB)
  if (queryUserId && queryUserId !== "default") {
    const queryUser = await prisma.user.findUnique({ where: { id: queryUserId } });
    if (queryUser) return queryUser;
  }

  // 3. Unauthenticated fallback - return first DB user if available for fallback or null
  const firstUser = await prisma.user.findFirst();
  return firstUser;
}
