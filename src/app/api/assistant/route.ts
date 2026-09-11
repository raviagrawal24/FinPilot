import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId: paramUserId, lang = "en" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message string is required." }, { status: 400 });
    }

    // Resolve user (Logged-in session > query param > demo user)
    const baseUser = await resolveTargetUser(request, paramUserId);
    if (!baseUser) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: baseUser.id },
      include: { accounts: true, liabilities: true, goals: true, subscriptions: true },
    });
    if (!user) {
      return NextResponse.json({ error: "No user found in database." }, { status: 404 });
    }

    const targetUserId = user.id;

    // Query DB context
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const transactions = await prisma.transaction.findMany({
      where: { userId: targetUserId },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    const currentMonthExpenses = transactions.filter(
      (tx) => tx.type === "EXPENSE" && new Date(tx.date) >= firstDayOfMonth
    );

    const totalMonthExpenses = currentMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyIncome = user.monthlyIncome || 85000;
    const monthlySurplus = monthlyIncome - totalMonthExpenses;
    const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(1) : "0";

    const liabilities = user.liabilities || [];
    const totalDebt = liabilities.reduce((sum, l) => sum + l.outstanding, 0);
    const totalEMI = liabilities.reduce((sum, l) => sum + l.emi, 0);

    const subscriptions = user.subscriptions || [];
    const totalSubCost = subscriptions.reduce((sum, s) => {
      const isYearly = s.billingCycle.toUpperCase() === "YEARLY";
      return sum + (isYearly ? s.amount / 12 : s.amount);
    }, 0);
    const unusedSubs = subscriptions.filter((s) => s.isUnused);

    const goals = user.goals || [];

    // Category breakdown
    const categoryTotals: Record<string, { amount: number; isEssential: boolean }> = {};
    currentMonthExpenses.forEach((tx) => {
      const catName = tx.category?.name || "Other";
      const isEssential = tx.category?.isEssential || false;
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { amount: 0, isEssential };
      }
      categoryTotals[catName].amount += tx.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b.amount - a.amount
    )[0];

    const isHindi = lang === "hi";

    // Check for OpenAI API key
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (openAiApiKey) {
      try {
        const systemPrompt = `You are FinPilot AI, a financial health copilot. Answer user questions using EXACT database metrics provided.
${isHindi ? "IMPORTANT: Respond strictly in natural, professional Hindi (हिन्दी). Preserve exact Rupee (₹) amounts, numbers, and dates without altering figures." : ""}
USER DB METRICS:
- Monthly Income: ₹${monthlyIncome.toLocaleString("en-IN")}
- Current Month Expenses: ₹${totalMonthExpenses.toLocaleString("en-IN")} (${currentMonthExpenses.length} transactions)
- Net Monthly Surplus: ₹${monthlySurplus.toLocaleString("en-IN")} (Savings Rate: ${savingsRate}%)
- Total Debt Outstanding: ₹${totalDebt.toLocaleString("en-IN")} (Monthly EMI: ₹${totalEMI.toLocaleString("en-IN")})
- Top Expense Category: ${topCategory ? `${topCategory[0]} (₹${topCategory[1].amount.toLocaleString("en-IN")})` : "None"}
- Active Subscriptions: ${subscriptions.length} (Monthly Cost: ₹${Math.round(totalSubCost).toLocaleString("en-IN")}, Unused: ${unusedSubs.length})
- Financial Goals: ${goals.length} goals
- Health Score: ${user.healthScore}/100

Format responses cleanly in Markdown with bold key numbers and bullet points. Never invent numbers outside this context.`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.3,
          }),
        });

        if (res.ok) {
          const openAiData = await res.json();
          const reply = openAiData.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ success: true, reply, source: "openai" });
          }
        }
      } catch (err) {
        console.warn("OpenAI API call failed, falling back to deterministic engine:", err);
      }
    }

    // Deterministic Rule-Based Financial Assistant Fallback
    const lowerQ = message.toLowerCase();
    let reply = "";

    if (isHindi) {
      // HINDI RESPONSES WITH ACCURATE DB NUMBERS
      if (lowerQ.includes("खर्च") || lowerQ.includes("spend") || lowerQ.includes("expense") || lowerQ.includes("कितना")) {
        reply = `### चालू माह खर्च विश्लेषण\n\n- **कुल मासिक खर्च:** ₹${totalMonthExpenses.toLocaleString("en-IN")}\n- **लेन-देन संख्या:** ${currentMonthExpenses.length} लेनदेन\n- **शीर्ष खर्च श्रेणी:** ${topCategory ? `**${topCategory[0]}** (₹${topCategory[1].amount.toLocaleString("en-IN")})` : "उपलब्ध नहीं"}\n- **औसत खर्च:** ₹${currentMonthExpenses.length > 0 ? Math.round(totalMonthExpenses / currentMonthExpenses.length).toLocaleString("en-IN") : "0"}\n\n*सुझाव:* आपका शीर्ष खर्च कुल मासिक खर्च का ${totalMonthExpenses > 0 && topCategory ? Math.round((topCategory[1].amount / totalMonthExpenses) * 100) : 0}% हिस्सा है। उच्च-मूल्य वाले लेन-देन की समीक्षा करने से तुरंत बचत होगी।`;
      } else if (lowerQ.includes("बचत") || lowerQ.includes("save") || lowerQ.includes("surplus") || lowerQ.includes("कैसे बचाएं")) {
        reply = `### बचत क्षमता और अधिशेष विश्लेषण\n\nइस महीने आपका कुल खर्च **₹${totalMonthExpenses.toLocaleString("en-IN")}** है और आपकी मासिक बचत **₹${monthlySurplus.toLocaleString("en-IN")}** है। आपकी बचत दर **${savingsRate}%** है।\n\n- **मासिक आय बेसलाइन:** ₹${monthlyIncome.toLocaleString("en-IN")}\n- **शुद्ध मासिक अधिशेष:** ₹${monthlySurplus.toLocaleString("en-IN")}\n- **बचत दर:** ${savingsRate}%\n\n*अनुशंसित आवंटन:*\n1. **₹${Math.round(monthlySurplus * 0.5).toLocaleString("en-IN")}** उच्च प्राथमिकता वाले ऋण चुकाने में\n2. **₹${Math.round(monthlySurplus * 0.3).toLocaleString("en-IN")}** बचत लक्ष्यों में\n3. **₹${Math.round(monthlySurplus * 0.2).toLocaleString("en-IN")}** तरल बफर के रूप में रखें।`;
      } else if (lowerQ.includes("ऋण") || lowerQ.includes("कर्ज") || lowerQ.includes("debt") || lowerQ.includes("ईएमआई")) {
        if (liabilities.length === 0) {
          reply = `### ऋण भुगतान सिफ़ारिश\n\nबधाई हो! आपके डेटाबेस में वर्तमान में **0 सक्रिय देनदारियां** हैं। आप पूरी तरह से ऋण मुक्त हैं।`;
        } else {
          const sortedD = [...liabilities].sort((a, b) => b.interestRate - a.interestRate);
          const topD = sortedD[0];
          const monthlyInterest = Math.round((topD.outstanding * (topD.interestRate / 100)) / 12);
          reply = `### ऋण प्राथमिकता (एवलान्च रणनीति)\n\n- **शीर्ष प्राथमिकता वाला ऋण:** **${topD.name}**\n- **कुल बकाया राशि:** ₹${topD.outstanding.toLocaleString("en-IN")}\n- **ब्याज दर:** **${topD.interestRate}% प्रति वर्ष**\n- **मासिक ब्याज खर्च:** ₹${monthlyInterest.toLocaleString("en-IN")}/माह\n\n*कार्य योजना:* अन्य सभी ऋणों पर न्यूनतम ईएमआई का भुगतान करें और अपने ₹${monthlySurplus > 0 ? monthlySurplus.toLocaleString("en-IN") : "0"} मासिक अधिशेष को पहले **${topD.name}** पर लगाएं!`;
        }
      } else if (lowerQ.includes("लक्ष्य") || lowerQ.includes("goal")) {
        if (goals.length === 0) {
          reply = `### वित्तीय लक्ष्य स्थिति\n\nडेटाबेस में कोई सक्रिय लक्ष्य नहीं है। लक्ष्य मील का पत्थर स्थापित करने के लिए लक्ष्य टैब पर जाएं।`;
        } else {
          const topG = goals[0];
          const pct = topG.targetAmount > 0 ? Math.round((topG.currentAmount / topG.targetAmount) * 100) : 0;
          reply = `### लक्ष्य प्रगति निदान\n\n- **मुख्य लक्ष्य:** **${topG.title}**\n- **लक्ष्य राशि:** ₹${topG.targetAmount.toLocaleString("en-IN")}\n- **वर्तमान बचत:** ₹${topG.currentAmount.toLocaleString("en-IN")} (${pct}% पूर्ण)\n- **मासिक योगदान:** ₹${topG.monthlyContribution.toLocaleString("en-IN")}/माह\n- **स्थिति:** ${topG.status}`;
        }
      } else {
        reply = `### FinPilot AI वित्तीय इंटेलिजेंस\n\nइस महीने आपका कुल खर्च **₹${totalMonthExpenses.toLocaleString("en-IN")}** है और आपकी मासिक बचत **₹${monthlySurplus.toLocaleString("en-IN")}** है। आपकी बचत दर **${savingsRate}%** है।\n\n- **मासिक आय:** ₹${monthlyIncome.toLocaleString("en-IN")}\n- **कुल देनदारियां (ऋण):** ₹${totalDebt.toLocaleString("en-IN")}\n- **सक्रिय लक्ष्य:** ${goals.length} लक्ष्य\n\nमुझसे विशिष्ट प्रश्न पूछें जैसे *"मेरा खर्च कैसा है?"*, *"मैं अधिक बचत कैसे कर सकता हूँ?"*, या *"कौन सा ऋण पहले चुकाएं?"*।`;
      }
    } else {
      // ENGLISH RESPONSES
      if (lowerQ.includes("spend") || lowerQ.includes("expense") || lowerQ.includes("how much did i spend")) {
        reply = `### Current Month Spending Analysis\n\n- **Total Expenses:** ₹${totalMonthExpenses.toLocaleString("en-IN")}\n- **Transaction Count:** ${currentMonthExpenses.length} transactions\n- **Top Category:** ${topCategory ? `**${topCategory[0]}** (₹${topCategory[1].amount.toLocaleString("en-IN")})` : "N/A"}\n- **Average Expense:** ₹${currentMonthExpenses.length > 0 ? Math.round(totalMonthExpenses / currentMonthExpenses.length).toLocaleString("en-IN") : "0"}\n\n*Recommendation:* Your top spending category represents ${totalMonthExpenses > 0 && topCategory ? Math.round((topCategory[1].amount / totalMonthExpenses) * 100) : 0}% of your total month spend. Reviewing high-value transactions here will yield immediate savings.`;
      } else if (lowerQ.includes("overspending") || lowerQ.includes("where am i spending")) {
        const discretionaryTotal = Object.values(categoryTotals)
          .filter((c) => !c.isEssential)
          .reduce((sum, c) => sum + c.amount, 0);

        reply = `### Overspending & Discretionary Leak Diagnostic\n\n- **Total Discretionary Spend:** ₹${discretionaryTotal.toLocaleString("en-IN")}\n- **Top Non-Essential Category:** ${topCategory ? `**${topCategory[0]}** (₹${topCategory[1].amount.toLocaleString("en-IN")})` : "N/A"}\n- **Discretionary Ratio:** ${totalMonthExpenses > 0 ? Math.round((discretionaryTotal / totalMonthExpenses) * 100) : 0}% of total expenses\n\n*Action Plan:* Trimming non-essential spending in ${topCategory ? topCategory[0] : "dining/shopping"} by 25% will boost your monthly savings by ₹${Math.round(discretionaryTotal * 0.25).toLocaleString("en-IN")}/month.`;
      } else if (lowerQ.includes("save") || lowerQ.includes("surplus") || lowerQ.includes("how can i save")) {
        reply = `### Savings Capacity & Surplus Analysis\n\n- **Monthly Income Baseline:** ₹${monthlyIncome.toLocaleString("en-IN")}\n- **Current Month Expenses:** ₹${totalMonthExpenses.toLocaleString("en-IN")}\n- **Net Monthly Surplus:** **₹${monthlySurplus.toLocaleString("en-IN")}**\n- **Savings Rate:** **${savingsRate}%**\n\n*Recommendation:* You currently save ₹${monthlySurplus.toLocaleString("en-IN")}/month. Allocate:\n1. **₹${Math.round(monthlySurplus * 0.5).toLocaleString("en-IN")}** towards high-priority debt reduction\n2. **₹${Math.round(monthlySurplus * 0.3).toLocaleString("en-IN")}** towards active goals\n3. **₹${Math.round(monthlySurplus * 0.2).toLocaleString("en-IN")}** liquid buffer.`;
      } else if (lowerQ.includes("debt") || lowerQ.includes("pay off") || lowerQ.includes("clear first") || lowerQ.includes("prioritize")) {
        if (liabilities.length === 0) {
          reply = `### Debt Payoff Recommendation\n\nGreat news! You currently have **0 active liabilities** in your database. You are 100% debt free.`;
        } else {
          const sortedD = [...liabilities].sort((a, b) => b.interestRate - a.interestRate);
          const topD = sortedD[0];
          const monthlyInterest = Math.round((topD.outstanding * (topD.interestRate / 100)) / 12);

          reply = `### Debt Prioritization (Avalanche Strategy)\n\n- **Top Priority Debt:** **${topD.name}**\n- **Outstanding Balance:** ₹${topD.outstanding.toLocaleString("en-IN")}\n- **Interest Rate:** **${topD.interestRate}% APR**\n- **Monthly Wasted Interest:** ₹${monthlyInterest.toLocaleString("en-IN")}/mo\n\n*Action Plan:* Pay minimum EMI on all other debts and allocate your ₹${monthlySurplus > 0 ? monthlySurplus.toLocaleString("en-IN") : "0"} monthly surplus to **${topD.name}** first!`;
        }
      } else if (lowerQ.includes("goal") || lowerQ.includes("track")) {
        if (goals.length === 0) {
          reply = `### Financial Goals Status\n\nYou have no active goals in the database. Navigate to the Goals tab to set up target savings milestones.`;
        } else {
          const topG = goals[0];
          const pct = topG.targetAmount > 0 ? Math.round((topG.currentAmount / topG.targetAmount) * 100) : 0;
          reply = `### Goal Progress Diagnostic\n\n- **Top Goal:** **${topG.title}**\n- **Target Amount:** ₹${topG.targetAmount.toLocaleString("en-IN")}\n- **Current Saved:** ₹${topG.currentAmount.toLocaleString("en-IN")} (${pct}% completed)\n- **Monthly Allocation:** ₹${topG.monthlyContribution.toLocaleString("en-IN")}/mo\n- **Status:** ${topG.status}\n\n*Reasoning:* Maintaining your current monthly deposit of ₹${topG.monthlyContribution.toLocaleString("en-IN")} keeps your goal on schedule for target completion.`;
        }
      } else if (lowerQ.includes("subscription") || lowerQ.includes("cancel")) {
        if (subscriptions.length === 0) {
          reply = `### Subscription Audit\n\nNo active subscriptions tracked in database.`;
        } else {
          reply = `### Subscription Audit & Savings Leaks\n\n- **Active Subscriptions:** ${subscriptions.length} services\n- **Monthly Recurring Spend:** ₹${Math.round(totalSubCost).toLocaleString("en-IN")}/mo\n- **Unused Subscriptions Flagged:** ${unusedSubs.length}\n\n${unusedSubs.length > 0 ? `*Cancellation Pick:* Cancel **${unusedSubs.map((s) => s.name).join(", ")}** to instantly save ₹${unusedSubs.reduce((acc, s) => acc + s.amount, 0).toLocaleString("en-IN")}/month!` : "*Status:* All active subscriptions show recent engagement."}`;
        }
      } else if (lowerQ.includes("summary") || lowerQ.includes("healthy") || lowerQ.includes("health")) {
        reply = `### FinPilot AI Complete Financial Health Summary\n\n- **Financial Health Score:** **${user.healthScore}/100**\n- **Monthly Income:** ₹${monthlyIncome.toLocaleString("en-IN")}\n- **Monthly Expenses:** ₹${totalMonthExpenses.toLocaleString("en-IN")}\n- **Net Monthly Savings:** ₹${monthlySurplus.toLocaleString("en-IN")} (${savingsRate}% rate)\n- **Total Debt:** ₹${totalDebt.toLocaleString("en-IN")} (${liabilities.length} active loans/cards)\n- **Active Goals:** ${goals.length} targets\n- **Recurring Subscriptions:** ₹${Math.round(totalSubCost).toLocaleString("en-IN")}/mo\n\n*Verdict:* Your financial foundation is solid with a ${savingsRate}% savings rate. Clearing high-interest liabilities will accelerate net worth growth.`;
      } else {
        reply = `### FinPilot Financial Intelligence\n\nBased on your database profile:\n- **Monthly Income:** ₹${monthlyIncome.toLocaleString("en-IN")}\n- **Current Spend:** ₹${totalMonthExpenses.toLocaleString("en-IN")}\n- **Net Surplus:** ₹${monthlySurplus.toLocaleString("en-IN")}\n- **Total Debt:** ₹${totalDebt.toLocaleString("en-IN")}\n\nAsk me specific questions like *"Where am I overspending?"*, *"Which debt should I clear first?"*, or *"Am I on track for my goals?"*.`;
      }
    }

    return NextResponse.json({ success: true, reply, source: "rule_engine" });
  } catch (error: any) {
    console.error("POST /api/assistant error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process assistant query." },
      { status: 500 }
    );
  }
}
