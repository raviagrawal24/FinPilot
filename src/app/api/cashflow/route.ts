import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    // 1. Resolve user (Logged-in session > query param > demo user)
    const baseUser = await resolveTargetUser(request, userId);
    if (!baseUser) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: baseUser.id },
      include: { accounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User details not found." }, { status: 404 });
    }

    const targetUserId = user.id;

    // 2. Fetch all user transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: targetUserId },
      include: { category: true },
      orderBy: { date: "asc" },
    });

    // Compute user liquid balance
    const accountsBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const hasAccounts = user.accounts.length > 0;

    // 3. Build 6-Month Timeline (5 past months + current month)
    const now = new Date();
    const monthsData: Array<{
      monthKey: string;
      monthLabel: string;
      income: number;
      expenses: number;
      net: number;
      year: number;
      monthIndex: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString("en-US", { month: "short" });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      monthsData.push({
        monthKey,
        monthLabel,
        income: 0,
        expenses: 0,
        net: 0,
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
      });
    }

    // Populate monthly transaction totals
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const txKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;

      const targetMonth = monthsData.find((m) => m.monthKey === txKey);
      if (targetMonth) {
        if (tx.type === "INCOME") {
          targetMonth.income += tx.amount;
        } else if (tx.type === "EXPENSE") {
          targetMonth.expenses += tx.amount;
        }
      }
    });

    // Fallback: If income is 0 for any month in the record, use user.monthlyIncome baseline
    monthsData.forEach((m) => {
      if (m.income === 0) {
        m.income = user.monthlyIncome || 85000;
      }
      m.net = m.income - m.expenses;
    });

    // 4. Calculate Cumulative Running Balance
    let baseBalance = hasAccounts && accountsBalance > 0 ? accountsBalance : 100000;
    
    // We compute running cumulative balances across the 6-month window
    let accumulator = baseBalance;
    const cashFlowPoints = monthsData.map((m, idx) => {
      if (idx === 0) {
        accumulator = baseBalance + m.net;
      } else {
        accumulator += m.net;
      }
      return {
        month: m.monthLabel,
        income: m.income,
        expenses: m.expenses,
        net: m.net,
        projectedBalance: Math.max(0, accumulator),
      };
    });

    // Current Month Metrics
    const currentMonthData = monthsData[monthsData.length - 1];
    const previousMonthData = monthsData[monthsData.length - 2] || monthsData[0];

    const currentMonthIncome = currentMonthData.income;
    const currentMonthExpenses = currentMonthData.expenses;
    const currentMonthNet = currentMonthData.net;

    const previousMonthNet = previousMonthData.net;
    const netChangeFromLastMonth = currentMonthNet - previousMonthNet;

    const currentBalance = accumulator;
    const projectedMonthEnd = currentBalance + (currentMonthNet > 0 ? currentMonthNet : 0);
    const isNegativeProjected = projectedMonthEnd < 0 || currentMonthNet < 0;

    const savingsRate = currentMonthIncome > 0
      ? Number(((currentMonthNet / currentMonthIncome) * 100).toFixed(1))
      : 0;

    const expenseRatio = currentMonthIncome > 0
      ? Number(((currentMonthExpenses / currentMonthIncome) * 100).toFixed(1))
      : 0;

    // 5. Average monthly expense check
    const pastExpenses = monthsData.slice(0, 5).map((m) => m.expenses);
    const avgPastExpenses = pastExpenses.length > 0
      ? pastExpenses.reduce((sum, v) => sum + v, 0) / pastExpenses.length
      : currentMonthExpenses;

    const isHighExpenseMonth = avgPastExpenses > 0 && currentMonthExpenses > avgPastExpenses * 1.2;

    // 6. Generate Rule-Based Explainable Cash-Flow Insights
    const insights: Array<{
      id: string;
      title: string;
      description: string;
      category: "warning" | "tip" | "opportunity";
      impact: string;
      icon: string;
    }> = [];

    // Insight 1: Net Savings
    if (currentMonthNet >= 0) {
      insights.push({
        id: "cf-savings",
        title: "Positive Net Cash Flow",
        description: `You are saving ₹${currentMonthNet.toLocaleString("en-IN")} this month (${savingsRate}% savings rate).`,
        category: "opportunity",
        impact: `+₹${currentMonthNet.toLocaleString("en-IN")}`,
        icon: "TrendingUp",
      });
    } else {
      insights.push({
        id: "cf-savings-deficit",
        title: "Cash Flow Deficit",
        description: `Your expenses exceed income by ₹${Math.abs(currentMonthNet).toLocaleString("en-IN")} this month.`,
        category: "warning",
        impact: `-₹${Math.abs(currentMonthNet).toLocaleString("en-IN")}`,
        icon: "AlertTriangle",
      });
    }

    // Insight 2: Expense Ratio
    insights.push({
      id: "cf-expense-ratio",
      title: "Expense-to-Income Ratio",
      description: `Expenses represent ${expenseRatio}% of your monthly income (₹${currentMonthExpenses.toLocaleString("en-IN")} spent out of ₹${currentMonthIncome.toLocaleString("en-IN")}).`,
      category: expenseRatio > 70 ? "warning" : "tip",
      impact: `${expenseRatio}% ratio`,
      icon: "Wallet",
    });

    // Insight 3: Month-End Pace
    insights.push({
      id: "cf-projection",
      title: "Projected Month-End Balance",
      description: `At your current spending pace, your projected month-end liquidity balance is ₹${projectedMonthEnd.toLocaleString("en-IN")}.`,
      category: isNegativeProjected ? "warning" : "opportunity",
      impact: `₹${projectedMonthEnd.toLocaleString("en-IN")}`,
      icon: "ShieldCheck",
    });

    // Insight 4: High Expense Warning (if applicable)
    if (isHighExpenseMonth) {
      const percentageOver = Math.round(((currentMonthExpenses - avgPastExpenses) / avgPastExpenses) * 100);
      insights.push({
        id: "cf-high-expense",
        title: "Unusually High Spending Detected",
        description: `Expenses this month are ${percentageOver}% higher than your 5-month historical average (₹${Math.round(avgPastExpenses).toLocaleString("en-IN")}).`,
        category: "warning",
        impact: `+${percentageOver}% vs avg`,
        icon: "AlertTriangle",
      });
    }

    // Insight 5: Negative balance critical warning
    if (isNegativeProjected) {
      insights.push({
        id: "cf-negative-warning",
        title: "Critical Deficit Alert",
        description: `Your committed expenses exceed liquidity. You risk a deficit of ₹${Math.abs(projectedMonthEnd).toLocaleString("en-IN")} by month end.`,
        category: "warning",
        impact: "Deficit risk",
        icon: "AlertTriangle",
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        monthlyIncome: user.monthlyIncome,
      },
      hasData: transactions.length > 0,
      transactionCount: transactions.length,
      currentBalance,
      expectedIncome: currentMonthIncome,
      committedExpenses: currentMonthExpenses,
      currentMonthNet,
      previousMonthNet,
      netChangeFromLastMonth,
      projectedMonthEnd,
      savingsRate,
      expenseRatio,
      isNegativeProjected,
      cashFlowPoints,
      insights,
    });
  } catch (error: any) {
    console.error("GET /api/cashflow error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to calculate cash flow intelligence." },
      { status: 500 }
    );
  }
}
