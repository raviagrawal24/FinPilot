import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const baseUser = await resolveTargetUser(request, userId);
    if (!baseUser) return NextResponse.json({ error: "No user found." }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: baseUser.id },
      include: { liabilities: true, goals: true },
    });
    if (!user) return NextResponse.json({ error: "No user found." }, { status: 404 });

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthExpenses = await prisma.transaction.aggregate({
      where: { userId: user.id, type: "EXPENSE", date: { gte: firstDayOfMonth } },
      _sum: { amount: true },
    });

    const baselineIncome = user.monthlyIncome || 85000;
    const baselineExpenses = monthExpenses._sum.amount || 54200;
    const baselineSavings = baselineIncome - baselineExpenses;
    const baselineSavingsRate =
      baselineIncome > 0 ? Number(((baselineSavings / baselineIncome) * 100).toFixed(1)) : 0;

    const liabilities = user.liabilities || [];
    const totalDebt = liabilities.reduce((sum, l) => sum + l.outstanding, 0);
    const monthlyEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);

    const goals = user.goals || [];
    let goalCompletionMonths = 9;
    if (goals.length > 0) {
      const topG = goals[0];
      const remaining = Math.max(0, topG.targetAmount - topG.currentAmount);
      const alloc = topG.monthlyContribution > 0 ? topG.monthlyContribution : Math.max(1000, baselineSavings * 0.3);
      goalCompletionMonths = Math.max(1, Math.ceil(remaining / alloc));
    }

    return NextResponse.json({
      success: true,
      baseline: { monthlyIncome: baselineIncome, monthlyExpenses: baselineExpenses, monthlySavings: baselineSavings, savingsRate: baselineSavingsRate, totalDebt, monthlyEMI, goalCompletionMonths },
    });
  } catch (error: any) {
    console.error("GET /api/simulator error:", error);
    return NextResponse.json({ error: "Failed to fetch simulator baseline." }, { status: 500 });
  }
}

function clamp(val: number, min: number, max: number) { return Math.min(max, Math.max(min, val)); }

function buildWhyItMatters(
  incomeDelta: number, rentDelta: number, expenseDelta: number, emiDelta: number,
  baselineSavings: number, simulatedSavings: number,
  baselineSavingsRate: number, simulatedSavingsRate: number,
  goalDelayMonths: number, sixMonthDiff: number
): string[] {
  const bullets: string[] = [];
  const rateDiff = simulatedSavingsRate - baselineSavingsRate;
  if (Math.abs(rateDiff) >= 1) {
    const dir = rateDiff > 0 ? "improves" : "drops";
    const zone = simulatedSavingsRate >= 30 ? "Excellent (30%+)" : simulatedSavingsRate >= 20 ? "Good (20-30%)" : simulatedSavingsRate >= 10 ? "Fair (10-20%)" : "At Risk (<10%)";
    bullets.push(`Your savings rate ${dir} from ${baselineSavingsRate}% to ${simulatedSavingsRate}%, placing you in the "${zone}" financial health zone.`);
  }
  if (Math.abs(sixMonthDiff) >= 500) {
    const dir = sixMonthDiff > 0 ? "more" : "less";
    const change = Math.abs(sixMonthDiff).toLocaleString("en-IN");
    const driver = incomeDelta !== 0 ? `a salary ${incomeDelta > 0 ? "increase" : "decrease"} of Rs.${Math.abs(incomeDelta).toLocaleString("en-IN")}` : rentDelta !== 0 ? `a rent ${rentDelta > 0 ? "increase" : "decrease"} of Rs.${Math.abs(rentDelta).toLocaleString("en-IN")}` : emiDelta !== 0 ? `an EMI ${emiDelta > 0 ? "addition" : "reduction"} of Rs.${Math.abs(emiDelta).toLocaleString("en-IN")}` : `expense changes of Rs.${Math.abs(expenseDelta).toLocaleString("en-IN")}`;
    bullets.push(`Over 6 months, ${driver} results in Rs.${change} ${dir} in cumulative savings.`);
  }
  if (Math.abs(goalDelayMonths) >= 1) {
    bullets.push(goalDelayMonths < 0 ? `Your primary financial goal will be completed ${Math.abs(goalDelayMonths)} month(s) earlier — accelerating your financial freedom.` : `Your primary financial goal will be delayed by ${goalDelayMonths} month(s) — consider increasing your monthly contribution to stay on track.`);
  }
  if (simulatedSavings < 0) {
    bullets.push(`Warning: This scenario results in a negative monthly cash flow of Rs.${Math.abs(simulatedSavings).toLocaleString("en-IN")} — expenses exceed income.`);
  } else if (simulatedSavings < 5000) {
    bullets.push(`Warning: Your simulated monthly surplus of Rs.${simulatedSavings.toLocaleString("en-IN")} is very thin — leaving little emergency buffer.`);
  }
  if (bullets.length === 0) bullets.push("No significant change detected. Adjust the sliders to model income, rent, expense, or EMI scenarios.");
  return bullets.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: paramUserId, incomeDelta = 0, rentDelta = 0, expenseDelta = 0, emiDelta = 0, goalContributionDelta = 0 } = body;

    const baseUser = await resolveTargetUser(request, paramUserId);
    if (!baseUser) return NextResponse.json({ error: "No user found." }, { status: 404 });

    const user = await prisma.user.findUnique({
      where: { id: baseUser.id },
      include: { liabilities: true, goals: true },
    });
    if (!user) return NextResponse.json({ error: "No user found." }, { status: 404 });

    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthExpenses = await prisma.transaction.aggregate({
      where: { userId: user.id, type: "EXPENSE", date: { gte: firstDayOfMonth } },
      _sum: { amount: true },
    });

    const baselineIncome = user.monthlyIncome || 85000;
    const baselineExpenses = monthExpenses._sum.amount || 54200;
    const baselineSavings = baselineIncome - baselineExpenses;
    const baselineSavingsRate = baselineIncome > 0 ? Number(((baselineSavings / baselineIncome) * 100).toFixed(1)) : 0;

    const simulatedIncome = Math.max(0, baselineIncome + Number(incomeDelta));
    const totalExpDelta = Number(rentDelta) + Number(expenseDelta) + Number(emiDelta);
    const simulatedExpenses = Math.max(0, baselineExpenses + totalExpDelta);
    const simulatedSavings = simulatedIncome - simulatedExpenses;
    const simulatedSavingsRate = simulatedIncome > 0 ? Number(((simulatedSavings / simulatedIncome) * 100).toFixed(1)) : 0;

    const surplusDiff = simulatedSavings - baselineSavings;
    const sixMonthCumulativeDiff = surplusDiff * 6;
    const healthScoreDelta = Math.round(clamp((simulatedSavingsRate - baselineSavingsRate) * 0.5, -15, 15));

    const goals = user.goals || [];
    let baselineGoalMonths = 9, simulatedGoalMonths = 9;
    if (goals.length > 0) {
      const topG = goals[0];
      const remaining = Math.max(0, topG.targetAmount - topG.currentAmount);
      const baseAlloc = topG.monthlyContribution > 0 ? topG.monthlyContribution : Math.max(1000, baselineSavings * 0.35);
      baselineGoalMonths = Math.max(1, Math.ceil(remaining / baseAlloc));
      const simAlloc = Math.max(500, baseAlloc + Number(goalContributionDelta) + surplusDiff * 0.3);
      simulatedGoalMonths = Math.max(1, Math.ceil(remaining / simAlloc));
    }
    const goalDelayMonths = simulatedGoalMonths - baselineGoalMonths;

    let impactStatus: "BETTER" | "WORSE" | "NEUTRAL" = "NEUTRAL";
    if (surplusDiff > 1000) impactStatus = "BETTER";
    else if (surplusDiff < -1000) impactStatus = "WORSE";

    let explainableText = "";
    if (Number(rentDelta) > 0) {
      explainableText = `Your rent increases by Rs.${Number(rentDelta).toLocaleString("en-IN")}/month. Monthly savings change from Rs.${baselineSavings.toLocaleString("en-IN")} to Rs.${simulatedSavings.toLocaleString("en-IN")} (savings rate: ${baselineSavingsRate}% to ${simulatedSavingsRate}%).`;
    } else if (incomeDelta !== 0) {
      explainableText = `Your income ${Number(incomeDelta) > 0 ? "increases" : "decreases"} by Rs.${Math.abs(Number(incomeDelta)).toLocaleString("en-IN")}/month. Net monthly surplus becomes Rs.${simulatedSavings.toLocaleString("en-IN")} (savings rate: ${simulatedSavingsRate}%).`;
    } else if (emiDelta !== 0) {
      explainableText = `Monthly EMI obligation ${Number(emiDelta) > 0 ? "increases" : "decreases"} by Rs.${Math.abs(Number(emiDelta)).toLocaleString("en-IN")}. Monthly savings shift to Rs.${simulatedSavings.toLocaleString("en-IN")}.`;
    } else {
      explainableText = `Scenario: Net monthly savings shift by Rs.${surplusDiff.toLocaleString("en-IN")} (from Rs.${baselineSavings.toLocaleString("en-IN")} to Rs.${simulatedSavings.toLocaleString("en-IN")}).`;
    }

    const whyItMatters = buildWhyItMatters(Number(incomeDelta), Number(rentDelta), Number(expenseDelta), Number(emiDelta), baselineSavings, simulatedSavings, baselineSavingsRate, simulatedSavingsRate, goalDelayMonths, sixMonthCumulativeDiff);

    const months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
    const comparisonChart = months.map((month, i) => ({ month, currentSavings: Math.max(0, (i + 1) * baselineSavings), simulatedSavings: Math.max(0, (i + 1) * simulatedSavings) }));

    return NextResponse.json({
      success: true,
      baseline: { monthlyIncome: baselineIncome, monthlyExpenses: baselineExpenses, monthlySavings: baselineSavings, savingsRate: baselineSavingsRate, goalCompletionMonths: baselineGoalMonths },
      simulated: { monthlyIncome: simulatedIncome, monthlyExpenses: simulatedExpenses, monthlySavings: simulatedSavings, savingsRate: simulatedSavingsRate, surplusDiff, goalCompletionMonths: simulatedGoalMonths },
      impactStatus, explainableText,
      savingsDiff: surplusDiff, sixMonthCumulativeDiff, goalDelayMonths, healthScoreDelta, whyItMatters, comparisonChart,
    });
  } catch (error: any) {
    console.error("POST /api/simulator error:", error);
    return NextResponse.json({ error: "Failed to run simulation." }, { status: 500 });
  }
}