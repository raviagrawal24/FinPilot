import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Resolve target user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);

    if (!user) {
      return NextResponse.json(
        { error: "No user found in the database." },
        { status: 404 }
      );
    }

    const targetUserId = user.id;

    // Date range for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Calculate current-month EXPENSE transactions from Prisma
    const currentMonthExpenses = await prisma.transaction.findMany({
      where: {
        userId: targetUserId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
    });

    const monthlyExpenses = currentMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0);

    // 2. Calculate current-month INCOME transactions from Prisma
    const currentMonthIncomes = await prisma.transaction.findMany({
      where: {
        userId: targetUserId,
        type: "INCOME",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const transactionIncome = currentMonthIncomes.reduce((sum, tx) => sum + tx.amount, 0);
    // Use user.monthlyIncome as baseline if no transaction income exists for current month
    const monthlyIncome = transactionIncome > 0 ? transactionIncome : (user.monthlyIncome || 0);

    // 3. Monthly savings & savings rate
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? Number(((monthlySavings / monthlyIncome) * 100).toFixed(1)) : 0;

    // 4. Total Debt: sum of Liability.outstanding for selected user
    const liabilityAggregate = await prisma.liability.aggregate({
      where: { userId: targetUserId },
      _sum: { outstanding: true },
    });
    const totalDebt = liabilityAggregate._sum.outstanding || 0;

    // 5. Expense Breakdown by Category
    const categoryTotals: Record<string, { name: string; amount: number; isEssential: boolean; color: string }> = {};

    currentMonthExpenses.forEach((tx) => {
      const catName = tx.category?.name || "Other";
      const isEssential = tx.category?.isEssential || false;
      const color = tx.category?.color || (catName === "Other" ? "#64748b" : "#8b5cf6");

      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { name: catName, amount: 0, isEssential, color };
      }
      categoryTotals[catName].amount += tx.amount;
    });

    const expenseBreakdown = Object.values(categoryTotals)
      .map((cat) => ({
        name: cat.name,
        amount: cat.amount,
        percentage: monthlyExpenses > 0 ? Number(((cat.amount / monthlyExpenses) * 100).toFixed(1)) : 0,
        color: cat.color,
        isEssential: cat.isEssential,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 6. Recent 10 Transactions
    const dbRecentTxns = await prisma.transaction.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "desc" },
      take: 10,
      include: { category: true, account: true },
    });

    const recentTransactions = dbRecentTxns.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString().slice(0, 10),
      merchant: tx.merchant,
      description: tx.description || tx.merchant,
      category: tx.category?.name || "Other",
      account: tx.account?.name || "Bank Account",
      type: tx.type,
      amount: tx.amount,
      isRecurring: tx.isRecurring,
    }));

    // 7. Transaction count
    const transactionCount = await prisma.transaction.count({
      where: { userId: targetUserId },
    });

    // 8. 6-Month Cash Flow (Previous 5 months + current month)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyCashFlow: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
      projectedBalance: number;
    }> = [];

    const accountSum = await prisma.account.aggregate({
      where: { userId: targetUserId },
      _sum: { balance: true },
    });
    let runningBalance = accountSum._sum.balance || 0;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = monthNames[d.getMonth()];

      const mIncomes = await prisma.transaction.aggregate({
        where: {
          userId: targetUserId,
          type: "INCOME",
          date: { gte: d, lte: mEnd },
        },
        _sum: { amount: true },
      });

      const mExpenses = await prisma.transaction.aggregate({
        where: {
          userId: targetUserId,
          type: "EXPENSE",
          date: { gte: d, lte: mEnd },
        },
        _sum: { amount: true },
      });

      const inc = mIncomes._sum.amount || 0;
      const exp = mExpenses._sum.amount || 0;
      const net = inc - exp;
      runningBalance += net;

      monthlyCashFlow.push({
        month: i === 0 ? `${monthLabel} (Est)` : monthLabel,
        income: inc,
        expenses: exp,
        net,
        projectedBalance: runningBalance,
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        healthScore: user.healthScore || 78,
      },
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      savingsRate,
      totalDebt,
      healthScore: user.healthScore || 78,
      transactionCount,
      expenseBreakdown,
      recentTransactions,
      monthlyCashFlow,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
