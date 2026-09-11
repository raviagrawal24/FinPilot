import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const targetUserId = user.id;

    // Fetch subscriptions from Prisma
    let rawSubscriptions = await prisma.subscription.findMany({
      where: { userId: targetUserId },
      orderBy: { nextBilling: "asc" },
    });

    // Auto-detect recurring transactions to ensure DB subscriptions are synced
    const recurringTxns = await prisma.transaction.findMany({
      where: {
        userId: targetUserId,
        type: "EXPENSE",
        isRecurring: true,
      },
      include: { category: true },
    });

    // Sync any recurring transaction that isn't yet in Subscription model
    for (const tx of recurringTxns) {
      const exists = rawSubscriptions.some(
        (s) => s.name.toLowerCase() === tx.merchant.toLowerCase()
      );
      if (!exists) {
        const nextB = new Date();
        nextB.setDate(nextB.getDate() + 30);

        const created = await prisma.subscription.create({
          data: {
            userId: targetUserId,
            name: tx.merchant,
            amount: tx.amount,
            billingCycle: "MONTHLY",
            nextBilling: nextB,
            category: tx.category?.name || "Services",
            isUnused: false,
          },
        });
        rawSubscriptions.push(created);
      }
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let monthlyCost = 0;
    let upcomingPaymentsCount = 0;
    let unusedSubscriptionsCount = 0;

    const subscriptions = rawSubscriptions.map((sub) => {
      const isYearly = sub.billingCycle.toUpperCase() === "YEARLY";
      const monthlyEquivalent = isYearly ? Number((sub.amount / 12).toFixed(2)) : sub.amount;

      monthlyCost += monthlyEquivalent;

      const nextB = new Date(sub.nextBilling);
      if (nextB >= now && nextB <= thirtyDaysFromNow) {
        upcomingPaymentsCount += 1;
      }

      if (sub.isUnused) {
        unusedSubscriptionsCount += 1;
      }

      return {
        id: sub.id,
        name: sub.name,
        amount: sub.amount,
        billingCycle: sub.billingCycle.toLowerCase(),
        nextBilling: sub.nextBilling.toISOString().slice(0, 10),
        category: sub.category || "Entertainment",
        isUnused: sub.isUnused,
        monthlyEquivalent,
      };
    });

    const totalActive = subscriptions.length;
    const annualizedCost = Math.round(monthlyCost * 12);
    monthlyCost = Math.round(monthlyCost);

    const insight = totalActive > 0
      ? `Your active subscriptions cost approximately ₹${monthlyCost.toLocaleString("en-IN")}/month or ₹${annualizedCost.toLocaleString("en-IN")}/year across ${totalActive} recurring services.`
      : "No active subscriptions tracked.";

    return NextResponse.json({
      success: true,
      hasSubscriptions: totalActive > 0,
      totalActive,
      monthlyCost,
      annualizedCost,
      upcomingPaymentsCount,
      unusedSubscriptionsCount,
      insight,
      subscriptions,
    });
  } catch (error: any) {
    console.error("GET /api/subscriptions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch subscriptions." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, name, amount, billingCycle, nextBilling, category, isUnused } = body;

    if (!name || amount === undefined || !nextBilling) {
      return NextResponse.json(
        { error: "Service name, amount, and next billing date are required." },
        { status: 400 }
      );
    }

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const numAmount = parseFloat(amount);
    const cycle = (billingCycle || "MONTHLY").toUpperCase();

    const newSub = await prisma.subscription.create({
      data: {
        userId: user.id,
        name,
        amount: numAmount,
        billingCycle: cycle,
        nextBilling: new Date(nextBilling),
        category: category || "Services",
        isUnused: Boolean(isUnused),
      },
    });

    return NextResponse.json({ success: true, subscription: newSub }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create subscription." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subscription ID is required." }, { status: 400 });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/subscriptions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete subscription." },
      { status: 500 }
    );
  }
}
