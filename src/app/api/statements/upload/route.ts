import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTargetUser } from "@/lib/auth";
import {
  categorizeTransaction,
  getOrCreateCategory,
  parseStatementDate,
  parseStatementAmount,
} from "@/lib/categorizer";
import * as XLSX from "xlsx";

interface RowErrorItem {
  rowNumber: number;
  merchant: string;
  rawDate: any;
  rawAmount: any;
  reason: string;
}

function normalizeHeader(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/^\uFEFF/g, "")          // BOM
    .replace(/^["']|["']$/g, "")      // surrounding quotes
    .replace(/[*#@!%^&(){}[\]<>]/g, " ") // special chars
    .toLowerCase()
    .replace(/[\/\-_\.]/g, " ")       // separators to space
    .replace(/\s+/g, "")              // collapse spaces
    .trim();
}

function findColumnValue(row: Record<string, any>, aliases: string[]): any {
  const keys = Object.keys(row);
  const normalizedAliases = aliases.map((a) => normalizeHeader(a));

  // Exact normalized match first
  for (let i = 0; i < aliases.length; i++) {
    const normAlias = normalizedAliases[i];
    const match = keys.find((k) => normalizeHeader(k) === normAlias);
    if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
      return row[match];
    }
  }

  // Substring normalized match
  for (let i = 0; i < aliases.length; i++) {
    const normAlias = normalizedAliases[i];
    const match = keys.find((k) => normalizeHeader(k).includes(normAlias));
    if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
      return row[match];
    }
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isSupported = filename.endsWith(".csv") || filename.endsWith(".xlsx") || filename.endsWith(".xls");
    if (!isSupported) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .csv, .xlsx, or .xls file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }

    // Resolve authenticated target user
    const resolvedUser = await resolveTargetUser(request, userId);
    if (!resolvedUser) {
      return NextResponse.json({ error: "User authentication required for statement upload." }, { status: 401 });
    }
    userId = resolvedUser.id;

    // Parse spreadsheet file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // cellDates:false so dates stay as Excel serials/strings — we handle conversion ourselves
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: "The uploaded spreadsheet has no sheets." }, { status: 400 });
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "", raw: false });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: "No transaction rows found in the uploaded file." }, { status: 400 });
    }

    // Debug: log headers and first row to help diagnose column mapping
    if (rawRows.length > 0) {
      const headers = Object.keys(rawRows[0]);
      console.log("[UPLOAD] Raw headers:", headers);
      console.log("[UPLOAD] Normalized headers:", headers.map(normalizeHeader));
      console.log("[UPLOAD] First row sample:", JSON.stringify(rawRows[0]));
    }

    // Column Aliases
    const dateAliases = [
      "date",
      "transaction date",
      "transactiondate",
      "txn date",
      "value date",
      "posting date",
      "dt",
      "trans date",
      "post date",
    ];

    const descriptionAliases = [
      "description",
      "narration",
      "transaction details",
      "details",
      "remarks",
      "merchant",
      "particulars",
    ];

    const merchantAliases = [
      "merchant",
      "merchant name",
      "payee",
      "description",
      "narration",
      "particulars",
    ];

    const amountAliases = [
      "amount",
      "transaction amount",
      "txn amount",
      "amt",
      "value",
      "total",
    ];

    const typeAliases = [
      "type",
      "transaction type",
      "dr/cr",
      "debit/credit",
      "cr/dr",
    ];

    const debitAliases = [
      "debit",
      "debit amount",
      "withdrawal",
      "withdrawals",
      "dr",
      "outflow",
    ];

    const creditAliases = [
      "credit",
      "credit amount",
      "deposit",
      "deposits",
      "cr",
      "inflow",
    ];

    // Fetch existing transactions for duplicate detection
    const existingTxns = await prisma.transaction.findMany({
      where: { userId: userId! },
      select: { date: true, merchant: true, amount: true, type: true },
    });

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const rowErrors: RowErrorItem[] = [];
    const importedTransactions: any[] = [];

    let rowIdx = 0;
    for (const row of rawRows) {
      rowIdx++;
      const rowNumber = rowIdx + 1; // 1-indexed (header is row 1)

      const hasContent = Object.values(row).some(
        (val) => val !== undefined && val !== null && String(val).trim() !== ""
      );
      if (!hasContent) continue;

      const rawDate = findColumnValue(row, dateAliases);
      const parsedDate = parseStatementDate(rawDate);

      const rawMerchant = findColumnValue(row, merchantAliases) || "Unknown Merchant";
      const rawDesc = findColumnValue(row, descriptionAliases) || String(rawMerchant);
      const merchant = String(rawMerchant).trim();
      const description = String(rawDesc).trim();

      const rawType = findColumnValue(row, typeAliases);
      const rawAmount = findColumnValue(row, amountAliases);
      const rawDebit = findColumnValue(row, debitAliases);
      const rawCredit = findColumnValue(row, creditAliases);

      if (!parsedDate) {
        errorCount++;
        const rawDateDisplay = rawDate === undefined ? "Missing column" : `"${rawDate}" (type: ${typeof rawDate})`;
        console.warn(`[UPLOAD] Row ${rowNumber} date parse failed — rawDate: ${rawDateDisplay}`);
        rowErrors.push({
          rowNumber,
          merchant: merchant || "Unknown",
          rawDate: rawDate ?? "Missing",
          rawAmount: rawAmount ?? rawDebit ?? rawCredit ?? "Missing",
          reason: `Row ${rowNumber}: Invalid transaction date (received: ${rawDateDisplay})`,
        });
        continue;
      }

      let type: "INCOME" | "EXPENSE" = "EXPENSE";
      let finalAmount: number | null = null;

      const debitVal = parseStatementAmount(rawDebit);
      const creditVal = parseStatementAmount(rawCredit);
      const amountVal = parseStatementAmount(rawAmount);

      // Debit/Credit columns preferred if present
      if (debitVal !== null && debitVal > 0) {
        type = "EXPENSE";
        finalAmount = debitVal;
      } else if (creditVal !== null && creditVal > 0) {
        type = "INCOME";
        finalAmount = creditVal;
      } else if (amountVal !== null) {
        const absAmount = Math.abs(amountVal);
        finalAmount = absAmount;

        if (rawType) {
          const typeStr = String(rawType).toLowerCase();
          if (typeStr.includes("credit") || typeStr.includes("cr") || typeStr.includes("income") || typeStr.includes("dep")) {
            type = "INCOME";
          } else {
            type = "EXPENSE";
          }
        } else if (amountVal < 0) {
          type = "EXPENSE";
        } else {
          // If positive amount, check if description indicates salary/credit or expense
          const lowerDesc = `${merchant} ${description}`.toLowerCase();
          if (lowerDesc.includes("salary") || lowerDesc.includes("payroll") || lowerDesc.includes("credit") || lowerDesc.includes("stipend")) {
            type = "INCOME";
          } else {
            // Default negative interpretation for expense if negative or positive without credit indicator
            const rawStr = String(rawAmount || "").toLowerCase();
            if (rawStr.includes("-") || rawStr.includes("dr")) {
              type = "EXPENSE";
            } else if (rawStr.includes("cr") || rawStr.includes("+")) {
              type = "INCOME";
            } else {
              type = amountVal > 0 && (lowerDesc.includes("salary") || lowerDesc.includes("income")) ? "INCOME" : "EXPENSE";
            }
          }
        }
      }

      if (finalAmount === null || isNaN(finalAmount) || finalAmount <= 0) {
        errorCount++;
        rowErrors.push({
          rowNumber,
          merchant: merchant || "Unknown",
          rawDate: rawDate ?? "N/A",
          rawAmount: rawAmount ?? rawDebit ?? rawCredit ?? "Missing",
          reason: `Row ${rowNumber}: Invalid transaction amount`,
        });
        continue;
      }

      // Duplicate Detection
      const dateIsoString = parsedDate.toISOString().slice(0, 10);
      const isDuplicate = existingTxns.some((existing) => {
        const existingIso = existing.date.toISOString().slice(0, 10);
        return (
          existingIso === dateIsoString &&
          existing.merchant.toLowerCase().trim() === merchant.toLowerCase() &&
          Math.abs(existing.amount - finalAmount!) < 0.01 &&
          existing.type === type
        );
      });

      if (isDuplicate) {
        skippedCount++;
        continue;
      }

      // Auto-categorize
      const catInfo = categorizeTransaction(merchant, description);
      const category = await getOrCreateCategory(catInfo.name);

      try {
        const createdTx = await prisma.transaction.create({
          data: {
            userId: userId!,
            date: parsedDate,
            merchant,
            description,
            type,
            amount: finalAmount,
            categoryId: category.id,
          },
          include: {
            category: true,
            account: true,
          },
        });

        existingTxns.push({
          date: parsedDate,
          merchant,
          amount: finalAmount,
          type,
        });

        importedCount++;
        importedTransactions.push(createdTx);
      } catch (dbErr: any) {
        console.error(`Row ${rowNumber} DB insertion error:`, dbErr);
        errorCount++;
        rowErrors.push({
          rowNumber,
          merchant,
          rawDate: rawDate ?? "N/A",
          rawAmount: finalAmount,
          reason: `Row ${rowNumber}: Database insertion error`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      skippedDuplicates: skippedCount,
      errors: errorCount,
      errorsCount: errorCount,
      rowErrors,
      transactions: importedTransactions,
    });
  } catch (error: any) {
    console.error("Statement upload route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to parse and import bank statement." },
      { status: 500 }
    );
  }
}
