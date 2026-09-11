import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";
import { categorizeTransaction, getOrCreateCategory } from "@/lib/categorizer";

// Helper to resolve target user ID using session cookie > query param > demo user
async function getTargetUserId(request: NextRequest, reqUserId: string | null): Promise<string | null> {
  const user = await resolveTargetUser(request, reqUserId);
  return user ? user.id : null;
}

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get("userId");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";

    const userId = await getTargetUserId(request, rawUserId);

    if (!userId) {
      return NextResponse.json({
        success: true,
        count: 0,
        transactions: [],
        summary: { totalTransactions: 0, totalIncome: 0, totalExpenses: 0, netCashFlow: 0 },
      });
    }

    // Build filter query
    const whereClause: any = { userId };

    if (type && type !== "ALL") {
      whereClause.type = type;
    }

    if (category && category !== "ALL") {
      whereClause.category = {
        name: { equals: category, mode: "insensitive" },
      };
    }

    if (search.trim()) {
      whereClause.OR = [
        { merchant: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Compute summary totals for all user transactions
    const allUserTxns = await prisma.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    allUserTxns.forEach((tx) => {
      if (tx.type === "INCOME") {
        totalIncome += tx.amount;
      } else if (tx.type === "EXPENSE") {
        totalExpenses += tx.amount;
      }
    });

    const netCashFlow = totalIncome - totalExpenses;

    return NextResponse.json({
      success: true,
      count: transactions.length,
      userId,
      summary: {
        totalTransactions: allUserTxns.length,
        totalIncome,
        totalExpenses,
        netCashFlow,
      },
      transactions,
    });
  } catch (error: any) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let {
      userId: rawUserId,
      accountId,
      categoryId,
      category,
      date,
      merchant,
      description,
      type,
      amount,
      isRecurring,
    } = body;

    let userId = await getTargetUserId(request, rawUserId);

    if (!userId) {
      const newUser = await prisma.user.create({
        data: {
          email: "demo@finpilot.test",
          name: "Ravi Agrawal",
          monthlyIncome: 85000,
          healthScore: 78,
        },
      });
      userId = newUser.id;
    }

    if (!date || !merchant || !type || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "date, merchant, type, and amount are required fields." },
        { status: 400 }
      );
    }

    if (!["INCOME", "EXPENSE", "TRANSFER"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid transaction type. Must be INCOME, EXPENSE, or TRANSFER." },
        { status: 400 }
      );
    }

    const parsedAmount = Math.abs(Number(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive valid number." },
        { status: 400 }
      );
    }

    // Resolve Category ID using auto-categorization engine if categoryId isn't provided
    if (!categoryId) {
      const categoryName = (category && typeof category === "string" && category.trim() !== "" && category.trim() !== "Other")
        ? category.trim()
        : categorizeTransaction(String(merchant), description ? String(description) : undefined).name;
      
      const catRecord = await getOrCreateCategory(categoryName);
      categoryId = catRecord.id;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format provided." },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: userId!,
        accountId: accountId || null,
        categoryId: categoryId || null,
        date: parsedDate,
        merchant: String(merchant).trim(),
        description: description ? String(description).trim() : String(merchant).trim(),
        type,
        amount: parsedAmount,
        isRecurring: Boolean(isRecurring),
      },
      include: {
        account: true,
        category: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        transaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions?id=TRANSACTION_ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction id is required for deletion." },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted successfully.",
      id,
    });
  } catch (error: any) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete transaction" },
      { status: 500 }
    );
  }
}