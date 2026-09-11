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

    // Run deterministic rules & sync alerts to database
    await syncSystemAlerts(targetUserId, user.monthlyIncome || 85000);

    // Fetch alerts from Prisma
    const rawAlerts = await prisma.alert.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
    });

    const totalAlerts = rawAlerts.length;
    const unreadCount = rawAlerts.filter((a) => !a.isRead).length;

    const alerts = rawAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      type: mapAlertTypeToUI(a.type),
      priority: a.priority,
      isRead: a.isRead,
      date: a.createdAt.toISOString().slice(0, 10),
    }));

    return NextResponse.json({
      success: true,
      hasAlerts: totalAlerts > 0,
      totalAlerts,
      unreadCount,
      alerts,
    });
  } catch (error: any) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch alerts." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId: paramUserId } = body;

    // Resolve user (Logged-in session > query param > demo user)
    const user = await resolveTargetUser(request, paramUserId);
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const targetUserId = user.id;

    if (action === "load_demo") {
      // 1. Create demo scenario transactions, subscriptions, liabilities
      await seedDemoAlertScenario(targetUserId);

      // 2. Run analysis
      const newAlertsCount = await syncSystemAlerts(targetUserId, user.monthlyIncome || 85000);
      const totalAlerts = await prisma.alert.count({ where: { userId: targetUserId } });

      return NextResponse.json({
        success: true,
        action: "load_demo",
        message: `Demo Alert Scenario Loaded — ${totalAlerts} alerts active.`,
        alertsDetected: totalAlerts,
        newAlertsCount,
      });
    }

    if (action === "clear_demo") {
      // Clear demo records
      await clearDemoAlertScenario(targetUserId);
      return NextResponse.json({
        success: true,
        action: "clear_demo",
        message: "Demo Alert Scenario Cleared cleanly.",
      });
    }

    // Default action: "analyze" -> Run system alert analysis over current real DB records
    const newAlertsCount = await syncSystemAlerts(targetUserId, user.monthlyIncome || 85000);
    const totalAlerts = await prisma.alert.count({ where: { userId: targetUserId } });

    return NextResponse.json({
      success: true,
      action: "analyze",
      message: `Analysis complete — ${totalAlerts} alerts detected.`,
      alertsDetected: totalAlerts,
      newAlertsCount,
    });
  } catch (error: any) {
    console.error("POST /api/alerts error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process alert analysis." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, markAllRead, userId } = body;

    if (markAllRead) {
      const user = await resolveTargetUser(request, userId);
      if (user) {
        await prisma.alert.updateMany({
          where: { userId: user.id },
          data: { isRead: true },
        });
      }
      return NextResponse.json({ success: true, message: "All alerts marked as read." });
    }

    if (!id) {
      return NextResponse.json({ error: "Alert ID is required." }, { status: 400 });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { isRead: isRead !== undefined ? isRead : true },
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error: any) {
    console.error("PATCH /api/alerts error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update alert status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      let userId = searchParams.get("userId");
      const user = await resolveTargetUser(request, userId);
      if (user) {
        await prisma.alert.deleteMany({ where: { userId: user.id } });
      }
      return NextResponse.json({ success: true, message: "All alerts cleared." });
    }

    if (!id) {
      return NextResponse.json({ error: "Alert ID is required." }, { status: 400 });
    }

    await prisma.alert.delete({ where: { id } });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/alerts error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete alert." },
      { status: 500 }
    );
  }
}

// Map AlertType enum to UI type strings
function mapAlertTypeToUI(type: string): "overspending" | "large_transaction" | "emi_due" | "subscription_renewal" | "low_cash_buffer" {
  switch (type) {
    case "OVERSPENDING":
      return "overspending";
    case "LARGE_TRANSACTION":
      return "large_transaction";
    case "UPCOMING_EMI":
      return "emi_due";
    case "SUBSCRIPTION_RENEWAL":
      return "subscription_renewal";
    case "LOW_CASH_BUFFER":
      return "low_cash_buffer";
    default:
      return "overspending";
  }
}

// Deterministic alert evaluation and database sync
async function syncSystemAlerts(userId: string, userMonthlyIncome: number): Promise<number> {
  const existingAlerts = await prisma.alert.findMany({
    where: { userId },
  });

  const existingTitles = new Set(existingAlerts.map((a) => a.title));
  let createdCount = 0;

  const alertsToCreate: Array<{
    userId: string;
    title: string;
    message: string;
    type: "OVERSPENDING" | "LARGE_TRANSACTION" | "UPCOMING_EMI" | "SUBSCRIPTION_RENEWAL" | "LOW_CASH_BUFFER";
    priority: "HIGH" | "MEDIUM" | "LOW";
  }> = [];

  const now = new Date();

  // 1. Large Expense / Unusually High Spending Alert
  const recentExpenses = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE" },
    include: { category: true },
    orderBy: { amount: "desc" },
    take: 5,
  });

  if (recentExpenses.length > 0) {
    const largestTx = recentExpenses[0];
    if (largestTx.amount >= 10000) {
      const title = `Unusually High Expense: ${largestTx.merchant}`;
      if (!existingTitles.has(title)) {
        alertsToCreate.push({
          userId,
          title,
          message: `${largestTx.merchant} spending is ₹${largestTx.amount.toLocaleString("en-IN")}, which is significantly above your recent average.`,
          type: "LARGE_TRANSACTION",
          priority: "HIGH",
        });
      }
    }
  }

  // 2. Upcoming Recurring Payment / Subscription Renewal (next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const upcomingSubs = await prisma.subscription.findMany({
    where: {
      userId,
      nextBilling: { gte: now, lte: sevenDaysFromNow },
    },
  });

  for (const sub of upcomingSubs) {
    const dateStr = new Date(sub.nextBilling).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const title = `Upcoming Recurring Payment: ${sub.name}`;
    if (!existingTitles.has(title)) {
      alertsToCreate.push({
        userId,
        title,
        message: `Your upcoming subscription payment of ₹${sub.amount.toLocaleString("en-IN")} for ${sub.name} is due on ${dateStr}.`,
        type: "SUBSCRIPTION_RENEWAL",
        priority: "MEDIUM",
      });
    }
  }

  // 3. Unused Subscription Leak Flag
  const unusedSubs = await prisma.subscription.findMany({
    where: { userId, isUnused: true },
  });

  for (const sub of unusedSubs) {
    const title = `Unused Subscription Leak: ${sub.name}`;
    if (!existingTitles.has(title)) {
      alertsToCreate.push({
        userId,
        title,
        message: `Unused subscription detected: ${sub.name} (₹${sub.amount.toLocaleString("en-IN")}/mo) has no active engagement logged.`,
        type: "SUBSCRIPTION_RENEWAL",
        priority: "MEDIUM",
      });
    }
  }

  // 4. High Discretionary Spending Alert
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthExpenses = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: firstDayOfMonth },
    },
    include: { category: true },
  });

  let totalMonthSpend = 0;
  let discretionarySpend = 0;
  currentMonthExpenses.forEach((tx) => {
    totalMonthSpend += tx.amount;
    if (!tx.category?.isEssential) {
      discretionarySpend += tx.amount;
    }
  });

  if (totalMonthSpend > 0) {
    const discPct = Math.round((discretionarySpend / totalMonthSpend) * 100);
    if (discPct >= 35) {
      const title = `High Discretionary Spending Warning (${discPct}%)`;
      if (!existingTitles.has(title)) {
        alertsToCreate.push({
          userId,
          title,
          message: `Discretionary non-essential spending makes up ${discPct}% (₹${discretionarySpend.toLocaleString("en-IN")}) of total monthly expenses.`,
          type: "OVERSPENDING",
          priority: "HIGH",
        });
      }
    }
  }

  // 5. Goal Contribution Risk
  const goals = await prisma.goal.findMany({
    where: { userId },
  });

  for (const g of goals) {
    const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
    const targetD = new Date(g.targetDate);
    const diffMs = targetD.getTime() - now.getTime();
    const monthsRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
    const requiredMonthly = Math.ceil(remainingAmount / monthsRemaining);

    if (g.monthlyContribution < requiredMonthly && g.currentAmount < g.targetAmount) {
      const title = `Goal Timeline Risk: ${g.title}`;
      if (!existingTitles.has(title)) {
        alertsToCreate.push({
          userId,
          title,
          message: `${g.title} requires ₹${requiredMonthly.toLocaleString("en-IN")}/mo to reach target by ${targetD.toLocaleDateString("en-US", { month: "short", year: "numeric" })}, but current deposit is ₹${g.monthlyContribution.toLocaleString("en-IN")}/mo.`,
          type: "LOW_CASH_BUFFER",
          priority: "HIGH",
        });
      }
    }
  }

  // 6. High Debt / EMI Burden
  const liabilities = await prisma.liability.findMany({
    where: { userId },
  });

  const totalEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);
  if (totalEMI > userMonthlyIncome * 0.35 && totalEMI > 0) {
    const emiPercentage = Math.round((totalEMI / userMonthlyIncome) * 100);
    const title = `High Debt EMI Burden (${emiPercentage}% of income)`;
    if (!existingTitles.has(title)) {
      alertsToCreate.push({
        userId,
        title,
        message: `High Debt Burden: Monthly EMI obligations of ₹${totalEMI.toLocaleString("en-IN")} absorb ${emiPercentage}% of your total monthly income (₹${userMonthlyIncome.toLocaleString("en-IN")}).`,
        type: "UPCOMING_EMI",
        priority: "HIGH",
      });
    }
  }

  // 7. Negative / Low Cash Flow Buffer
  if (totalMonthSpend >= userMonthlyIncome * 0.85 && totalMonthSpend > 0) {
    const expenseRatio = Math.round((totalMonthSpend / userMonthlyIncome) * 100);
    const title = totalMonthSpend >= userMonthlyIncome ? "CRITICAL: Negative Cash Flow Deficit" : "Low Cash Flow Buffer Warning";
    if (!existingTitles.has(title)) {
      alertsToCreate.push({
        userId,
        title,
        message: `Cash Flow Alert: Monthly expenses of ₹${totalMonthSpend.toLocaleString("en-IN")} consume ${expenseRatio}% of your monthly income.`,
        type: "LOW_CASH_BUFFER",
        priority: "HIGH",
      });
    }
  }

  // Batch insert new alerts
  if (alertsToCreate.length > 0) {
    const res = await prisma.alert.createMany({
      data: alertsToCreate,
    });
    createdCount = res.count;
  }

  return createdCount;
}

// Helper to seed realistic demo alert scenario records
async function seedDemoAlertScenario(userId: string) {
  // Ensure default categories exist
  const shoppingCat = await prisma.category.upsert({
    where: { name: "Shopping" },
    update: {},
    create: { name: "Shopping", icon: "ShoppingBag", color: "#f59e0b", isEssential: false },
  });

  const foodCat = await prisma.category.upsert({
    where: { name: "Food & Dining" },
    update: {},
    create: { name: "Food & Dining", icon: "Utensils", color: "#ec4899", isEssential: false },
  });

  // Seed demo transactions
  const demoTxns = [
    {
      userId,
      merchant: "Apple Store Premium",
      description: "Demo: High value hardware purchase",
      amount: 145000,
      type: "EXPENSE" as const,
      date: new Date(),
      categoryId: shoppingCat.id,
      isRecurring: false,
    },
    {
      userId,
      merchant: "Luxury Gourmet Dining",
      description: "Demo: High discretionary restaurant charge",
      amount: 18500,
      type: "EXPENSE" as const,
      date: new Date(),
      categoryId: foodCat.id,
      isRecurring: false,
    },
  ];

  for (const tx of demoTxns) {
    const exists = await prisma.transaction.findFirst({
      where: { userId, merchant: tx.merchant, amount: tx.amount },
    });
    if (!exists) {
      await prisma.transaction.create({ data: tx });
    }
  }

  // Seed demo subscription due in 3 days & an unused subscription
  const due3Days = new Date();
  due3Days.setDate(due3Days.getDate() + 3);

  const demoSubs = [
    {
      userId,
      name: "AWS Cloud Infrastructure",
      amount: 12500,
      billingCycle: "MONTHLY",
      nextBilling: due3Days,
      category: "Software",
      isUnused: false,
    },
    {
      userId,
      name: "Premium Fitness Gym",
      amount: 3500,
      billingCycle: "MONTHLY",
      nextBilling: due3Days,
      category: "Health",
      isUnused: true,
    },
  ];

  for (const s of demoSubs) {
    const exists = await prisma.subscription.findFirst({
      where: { userId, name: s.name },
    });
    if (!exists) {
      await prisma.subscription.create({ data: s });
    }
  }

  // Seed demo high EMI liability
  const existingLiab = await prisma.liability.findFirst({
    where: { userId, name: "Premium Credit Card Balance" },
  });
  if (!existingLiab) {
    await prisma.liability.create({
      data: {
        userId,
        name: "Premium Credit Card Balance",
        outstanding: 85000,
        interestRate: 36.0,
        emi: 28000,
        minimumDue: 8500,
        dueDate: due3Days,
      },
    });
  }

  // Seed demo goal at risk
  const existingGoal = await prisma.goal.findFirst({
    where: { userId, title: "House Downpayment" },
  });
  if (!existingGoal) {
    const targetD = new Date();
    targetD.setFullYear(targetD.getFullYear() + 2);
    await prisma.goal.create({
      data: {
        userId,
        title: "House Downpayment",
        targetAmount: 1500000,
        currentAmount: 120000,
        monthlyContribution: 10000, // Insufficient for target date
        targetDate: targetD,
      },
    });
  }
}

// Helper to clear demo alert scenario records cleanly
async function clearDemoAlertScenario(userId: string) {
  // Delete demo transactions
  await prisma.transaction.deleteMany({
    where: {
      userId,
      merchant: { in: ["Apple Store Premium", "Luxury Gourmet Dining"] },
    },
  });

  // Delete demo subscriptions
  await prisma.subscription.deleteMany({
    where: {
      userId,
      name: { in: ["AWS Cloud Infrastructure", "Premium Fitness Gym"] },
    },
  });

  // Delete demo liability
  await prisma.liability.deleteMany({
    where: {
      userId,
      name: "Premium Credit Card Balance",
    },
  });

  // Delete demo goal
  await prisma.goal.deleteMany({
    where: {
      userId,
      title: "House Downpayment",
    },
  });

  // Clear demo alerts
  await prisma.alert.deleteMany({
    where: { userId },
  });
}
