import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");
    const timeframe = searchParams.get("timeframe") || "current_month"; // current_month | previous_month | all_time
    const typeFilter = searchParams.get("typeFilter") || "all"; // all | essential | discretionary

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, userId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const targetUserId = user.id;

    // Date range calculation
    const now = new Date();
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    if (timeframe === "current_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (timeframe === "previous_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    const dateQuery: any = {};
    if (startDate) dateQuery.gte = startDate;
    if (endDate) dateQuery.lte = endDate;

    // Query EXPENSE transactions
    const whereClause: any = {
      userId: targetUserId,
      type: "EXPENSE",
    };
    if (Object.keys(dateQuery).length > 0) {
      whereClause.date = dateQuery;
    }

    const rawTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    });

    // Apply typeFilter if specified (essential vs discretionary)
    let filteredTransactions = rawTransactions;
    if (typeFilter === "essential") {
      filteredTransactions = rawTransactions.filter((tx) => tx.category?.isEssential === true);
    } else if (typeFilter === "discretionary") {
      filteredTransactions = rawTransactions.filter((tx) => !tx.category?.isEssential);
    }

    // Basic Metrics
    const totalExpenses = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const transactionCount = filteredTransactions.length;
    const averageExpense = transactionCount > 0 ? Math.round(totalExpenses / transactionCount) : 0;

    // Essential vs Discretionary breakdown across all expense transactions in timeframe
    let essentialExpenses = 0;
    let discretionaryExpenses = 0;

    rawTransactions.forEach((tx) => {
      if (tx.category?.isEssential) {
        essentialExpenses += tx.amount;
      } else {
        discretionaryExpenses += tx.amount;
      }
    });

    const timeframeTotal = rawTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const essentialPercentage = timeframeTotal > 0 ? Number(((essentialExpenses / timeframeTotal) * 100).toFixed(1)) : 0;
    const discretionaryPercentage = timeframeTotal > 0 ? Number(((discretionaryExpenses / timeframeTotal) * 100).toFixed(1)) : 0;

    // Largest Expense
    let largestExpense: any = null;
    if (filteredTransactions.length > 0) {
      const sortedByAmt = [...filteredTransactions].sort((a, b) => b.amount - a.amount);
      const top = sortedByAmt[0];
      largestExpense = {
        id: top.id,
        merchant: top.merchant,
        amount: top.amount,
        date: top.date.toISOString().slice(0, 10),
        category: top.category?.name || "Other",
      };
    }

    // Recurring expenses sum & list
    const recurringList = rawTransactions.filter((tx) => tx.isRecurring);
    const recurringExpenseTotal = recurringList.reduce((sum, tx) => sum + tx.amount, 0);

    // Category grouping
    const categoryMap: Record<string, { name: string; amount: number; isEssential: boolean; count: number; color: string }> = {};

    filteredTransactions.forEach((tx) => {
      const catName = tx.category?.name || "Other";
      const isEssential = tx.category?.isEssential || false;
      const color = tx.category?.color || (catName === "Other" ? "#64748b" : "#8b5cf6");

      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, amount: 0, isEssential, count: 0, color };
      }
      categoryMap[catName].amount += tx.amount;
      categoryMap[catName].count += 1;
    });

    const categories = Object.values(categoryMap)
      .map((c) => {
        const percentage = totalExpenses > 0 ? Number(((c.amount / totalExpenses) * 100).toFixed(1)) : 0;
        return {
          name: c.name,
          amount: c.amount,
          percentage,
          isEssential: c.isEssential,
          count: c.count,
          color: c.color,
          explanation: `${c.name}: ₹${c.amount.toLocaleString("en-IN")} (${percentage}% of total expenses, based on ${c.count} transaction${c.count > 1 ? "s" : ""})`,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Rule-based insights generation
    const insights: Array<{ id: string; title: string; description: string; category: "warning" | "tip" | "opportunity"; impact: string; icon: string }> = [];

    if (categories.length > 0) {
      const topCat = categories[0];
      insights.push({
        id: "insight-top-cat",
        title: `${topCat.name} is Your Top Expense`,
        description: `${topCat.explanation}. Reviewing ${topCat.name} charges could yield immediate monthly savings.`,
        category: topCat.isEssential ? "tip" : "warning",
        impact: `${topCat.percentage}% of spend`,
        icon: topCat.name === "Food" ? "Utensils" : "ShoppingBag",
      });
    }

    if (discretionaryPercentage > 30 && timeframeTotal > 0) {
      insights.push({
        id: "insight-discretionary",
        title: "High Discretionary Spending Alert",
        description: `Discretionary spending makes up ${discretionaryPercentage}% (₹${discretionaryExpenses.toLocaleString("en-IN")}) of total expenses. Reducing non-essentials can boost savings rate.`,
        category: "warning",
        impact: `${discretionaryPercentage}% discretionary`,
        icon: "ShoppingBag",
      });
    } else if (essentialPercentage >= 70 && timeframeTotal > 0) {
      insights.push({
        id: "insight-essential",
        title: "Strong Essential Allocation",
        description: `Essential necessities account for ${essentialPercentage}% of expenses. Your baseline budget is highly disciplined.`,
        category: "opportunity",
        impact: `${essentialPercentage}% essential`,
        icon: "ShieldCheck",
      });
    }

    if (largestExpense) {
      insights.push({
        id: "insight-largest",
        title: "Largest Single Expense",
        description: `Your highest individual transaction was ₹${largestExpense.amount.toLocaleString("en-IN")} at ${largestExpense.merchant} on ${largestExpense.date}.`,
        category: "tip",
        impact: `₹${largestExpense.amount.toLocaleString("en-IN")}`,
        icon: "CreditCard",
      });
    }

    if (recurringExpenseTotal > 0) {
      insights.push({
        id: "insight-recurring",
        title: "Recurring Subscriptions Active",
        description: `You have ${recurringList.length} recurring subscription expense${recurringList.length > 1 ? "s" : ""} totaling ₹${recurringExpenseTotal.toLocaleString("en-IN")}.`,
        category: "tip",
        impact: `₹${recurringExpenseTotal.toLocaleString("en-IN")}/mo`,
        icon: "RefreshCw",
      });
    }

    return NextResponse.json({
      success: true,
      timeframe,
      typeFilter,
      totalExpenses,
      essentialExpenses,
      discretionaryExpenses,
      essentialPercentage,
      discretionaryPercentage,
      transactionCount,
      averageExpense,
      largestExpense,
      recurringExpenseTotal,
      categories,
      recurringExpenses: recurringList.map((tx) => ({
        id: tx.id,
        merchant: tx.merchant,
        amount: tx.amount,
        category: tx.category?.name || "Other",
        date: tx.date.toISOString().slice(0, 10),
      })),
      insights,
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch expense calculations." },
      { status: 500 }
    );
  }
}
