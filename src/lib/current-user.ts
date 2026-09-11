import { NextRequest } from "next/server";
import { getCurrentUser, UserSessionData } from "@/lib/auth";

export type ActiveUser = UserSessionData;

export async function getActiveUser(request?: NextRequest): Promise<ActiveUser | null> {
  return await getCurrentUser(request);
}
