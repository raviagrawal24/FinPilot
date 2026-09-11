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

    // Fetch goals from Prisma
    const rawGoals = await prisma.goal.findMany({
      where: { userId: targetUserId },
      orderBy: { targetDate: "asc" },
    });

    const now = new Date();

    const goals = rawGoals.map((g) => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const percentageCompleted = g.targetAmount > 0
        ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
        : 0;

      const targetD = new Date(g.targetDate);
      const diffMs = targetD.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30));

      const calculatedRequiredMonthly = Math.ceil(remainingAmount / monthsRemaining);
      const requiredMonthlyContribution = g.monthlyContribution > 0
        ? g.monthlyContribution
        : calculatedRequiredMonthly;

      // Status determination
      let status = "ON_TRACK";
      if (g.currentAmount >= g.targetAmount) {
        status = "COMPLETED";
      } else if (g.monthlyContribution < calculatedRequiredMonthly) {
        status = "AT_RISK";
      }

      const formattedTargetDate = targetD.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const recommendation = `To reach your ₹${g.targetAmount.toLocaleString("en-IN")} ${g.title} by ${formattedTargetDate}, you need to contribute approximately ₹${calculatedRequiredMonthly.toLocaleString("en-IN")}/month.`;

      return {
        id: g.id,
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        monthlyContribution: g.monthlyContribution,
        requiredMonthlyContribution: calculatedRequiredMonthly,
        remainingAmount,
        percentageCompleted,
        monthsRemaining,
        targetDate: g.targetDate.toISOString().slice(0, 10),
        formattedTargetDate,
        status,
        recommendation,
        createdAt: g.createdAt,
      };
    });

    const totalGoals = goals.length;
    const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalMonthlyContribution = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);

    return NextResponse.json({
      success: true,
      hasGoals: totalGoals > 0,
      totalGoals,
      totalTargetAmount,
      totalSaved,
      totalMonthlyContribution,
      goals,
    });
  } catch (error: any) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch goals." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, title, name, targetAmount, currentAmount, monthlyContribution, targetDate } = body;

    const goalTitle = title || name;

    if (!goalTitle || !targetAmount || !targetDate) {
      return NextResponse.json(
        { error: "Title, target amount, and target date are required." },
        { status: 400 }
      );
    }

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const numTarget = parseFloat(targetAmount);
    const numCurrent = currentAmount ? parseFloat(currentAmount) : 0;
    const numMonthly = monthlyContribution ? parseFloat(monthlyContribution) : 0;

    const newGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: goalTitle,
        targetAmount: numTarget,
        currentAmount: numCurrent,
        monthlyContribution: numMonthly,
        targetDate: new Date(targetDate),
      },
    });

    return NextResponse.json({ success: true, goal: newGoal }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create goal." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Goal ID is required." }, { status: 400 });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/goals error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete goal." },
      { status: 500 }
    );
  }
}
