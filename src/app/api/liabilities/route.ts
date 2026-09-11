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

    // Fetch liabilities from Prisma
    const rawLiabilities = await prisma.liability.findMany({
      where: { userId: targetUserId },
      orderBy: { interestRate: "desc" },
    });

    const totalDebt = rawLiabilities.reduce((sum, l) => sum + l.outstanding, 0);
    const totalMonthlyEMI = rawLiabilities.reduce((sum, l) => sum + l.emi, 0);
    const activeLiabilitiesCount = rawLiabilities.length;

    const highestInterestRate = rawLiabilities.length > 0
      ? Math.max(...rawLiabilities.map((l) => l.interestRate))
      : 0;

    // Calculate weighted average interest rate
    let weightedAverageInterestRate = 0;
    if (totalDebt > 0) {
      const sumWeighted = rawLiabilities.reduce((sum, l) => sum + (l.interestRate * l.outstanding), 0);
      weightedAverageInterestRate = Number((sumWeighted / totalDebt).toFixed(1));
    }

    // Debt Prioritization (Avalanche Method: Highest interest rate first, then highest balance)
    const sortedForPriority = [...rawLiabilities].sort((a, b) => {
      if (b.interestRate !== a.interestRate) {
        return b.interestRate - a.interestRate;
      }
      if (b.outstanding !== a.outstanding) {
        return b.outstanding - a.outstanding;
      }
      return b.emi - a.emi;
    });

    const liabilities = rawLiabilities.map((l) => {
      const rankIndex = sortedForPriority.findIndex((item) => item.id === l.id);
      const priorityRank = rankIndex + 1;

      let priorityReason = "";
      if (priorityRank === 1 && rawLiabilities.length > 1) {
        priorityReason = `${l.name} is Priority #1 because its interest rate of ${l.interestRate}% APR is higher than your other active liabilities.`;
      } else if (priorityRank === 1) {
        priorityReason = `${l.name} is your highest priority debt to clear.`;
      } else {
        priorityReason = `Priority #${priorityRank}: Pay minimum EMI, then direct surplus to Priority #1 debt.`;
      }

      // Type inferencing (e.g. Credit Card, Home Loan, Personal Loan)
      let type = "LOAN";
      const nameLower = l.name.toLowerCase();
      if (nameLower.includes("credit card") || nameLower.includes("card") || l.interestRate >= 20) {
        type = "CREDIT_CARD";
      } else if (nameLower.includes("home") || nameLower.includes("housing")) {
        type = "MORTGAGE";
      } else if (nameLower.includes("car") || nameLower.includes("auto") || nameLower.includes("vehicle")) {
        type = "AUTO_LOAN";
      } else if (nameLower.includes("personal")) {
        type = "PERSONAL_LOAN";
      }

      return {
        id: l.id,
        name: l.name,
        type,
        outstanding: l.outstanding,
        interestRate: l.interestRate,
        emi: l.emi,
        minimumDue: l.minimumDue || null,
        dueDate: l.dueDate ? l.dueDate.toISOString().slice(0, 10) : null,
        priorityRank,
        priorityReason,
      };
    });

    // Strategy recommendation text
    let topRecommendation = null;
    if (sortedForPriority.length > 0) {
      const topDebt = sortedForPriority[0];
      const monthlyInterestWaste = Math.round((topDebt.outstanding * (topDebt.interestRate / 100)) / 12);
      topRecommendation = {
        priorityDebtName: topDebt.name,
        interestRate: topDebt.interestRate,
        monthlyInterestWaste,
        explanation: `FinPilot AI identified that your ${topDebt.name} (${topDebt.interestRate}% APR) generates approximately ₹${monthlyInterestWaste.toLocaleString("en-IN")} in monthly interest. Pay off ${topDebt.name} first using the Avalanche Method to eliminate high-interest cost!`,
      };
    }

    return NextResponse.json({
      success: true,
      hasLiabilities: activeLiabilitiesCount > 0,
      totalDebt,
      totalMonthlyEMI,
      activeLiabilitiesCount,
      highestInterestRate,
      weightedAverageInterestRate,
      topRecommendation,
      liabilities,
    });
  } catch (error: any) {
    console.error("GET /api/liabilities error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch liabilities." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, name, outstanding, interestRate, emi, minimumDue, dueDate } = body;

    if (!name || outstanding === undefined || interestRate === undefined || emi === undefined) {
      return NextResponse.json(
        { error: "Name, outstanding balance, interest rate, and monthly EMI are required." },
        { status: 400 }
      );
    }

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const numOutstanding = parseFloat(outstanding);
    const numInterestRate = parseFloat(interestRate);
    const numEMI = parseFloat(emi);
    const numMinDue = minimumDue ? parseFloat(minimumDue) : null;
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    const newLiability = await prisma.liability.create({
      data: {
        userId: user.id,
        name,
        outstanding: numOutstanding,
        interestRate: numInterestRate,
        emi: numEMI,
        minimumDue: numMinDue,
        dueDate: parsedDueDate,
      },
    });

    return NextResponse.json({ success: true, liability: newLiability }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/liabilities error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create liability." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Liability ID is required." }, { status: 400 });
    }

    await prisma.liability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/liabilities error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete liability." },
      { status: 500 }
    );
  }
}
