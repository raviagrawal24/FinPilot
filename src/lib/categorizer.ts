import { prisma } from "@/lib/prisma";

export interface CategoryInfo {
  name: string;
  isEssential: boolean;
  color: string;
}

const CATEGORY_MAP: Record<string, { isEssential: boolean; color: string; keywords: string[] }> = {
  Food: {
    isEssential: true,
    color: "#ec4899",
    keywords: [
      "swiggy", "zomato", "uber eats", "domino", "mcdonald", "burger", "pizza",
      "subway", "starbucks", "dunkin", "kfc", "restaurant", "cafe", "biryani",
      "mess", "dhaba", "diner", "bakery", "bistro", "canteen", "food", "dining",
      "eat", "eatery", "haldiram", "barbeque", "chai", "coffee", "sweet"
    ],
  },
  Transport: {
    isEssential: true,
    color: "#3b82f6",
    keywords: [
      "uber", "ola", "rapido", "metro", "bus", "fuel", "petrol", "diesel",
      "indian oil", "hpcl", "bharat petroleum", "bpcl", "shell", "parking",
      "toll", "fastag", "cab", "taxi", "transit", "auto", "transport", "railway"
    ],
  },
  Shopping: {
    isEssential: false,
    color: "#f59e0b",
    keywords: [
      "amazon", "flipkart", "myntra", "ajio", "shopping", "retail", "zara",
      "h&m", "uniqlo", "trends", "croma", "reliance digital", "ikea",
      "decathlon", "mart", "store", "mall", "fashion", "apparel", "cloth", "meesho"
    ],
  },
  Subscriptions: {
    isEssential: false,
    color: "#10b981",
    keywords: [
      "netflix", "spotify", "prime video", "hotstar", "youtube", "apple",
      "hbo", "disney", "gaana", "jiosaavn", "patreon", "chatgpt", "midjourney",
      "medium", "github", "subscript", "audible", "prime", "software"
    ],
  },
  Utilities: {
    isEssential: true,
    color: "#6366f1",
    keywords: [
      "electricity", "water", "gas", "airtel", "jio", "vi", "vodafone",
      "broadband", "internet", "tata play", "dish tv", "bill", "utility",
      "power", "recharge", "postpaid", "dth"
    ],
  },
  Housing: {
    isEssential: true,
    color: "#8b5cf6",
    keywords: [
      "rent", "housing", "apartment", "landlord", "society", "maintenance",
      "lease", "mortgage", "flat", "pg"
    ],
  },
  Healthcare: {
    isEssential: true,
    color: "#ef4444",
    keywords: [
      "pharmacy", "apollo", "1mg", "practo", "hospital", "doctor", "clinic",
      "medical", "health", "lab", "pathology", "medicine", "pharma", "dental", "pharmeasy"
    ],
  },
  Education: {
    isEssential: true,
    color: "#14b8a6",
    keywords: [
      "school", "college", "university", "udemy", "coursera", "edx", "tuition",
      "fees", "books", "course", "academy", "coaching", "exam"
    ],
  },
  Travel: {
    isEssential: false,
    color: "#f97316",
    keywords: [
      "flight", "airline", "indigo", "air india", "make my trip", "makemytrip",
      "cleartrip", "hotel", "airbnb", "stay", "booking.com", "irctc", "train",
      "resort", "trip", "travel", "agoda"
    ],
  },
  Salary: {
    isEssential: false,
    color: "#22c55e",
    keywords: [
      "salary", "payroll", "employer", "stipend", "wage", "income", "remuneration", "payout"
    ],
  },
  Investment: {
    isEssential: false,
    color: "#8b5cf6",
    keywords: [
      "zerodha", "groww", "upstox", "mutual fund", "sip", "coin", "indmoney",
      "investment", "stocks", "equity", "bse", "nse", "demat"
    ],
  },
  Transfer: {
    isEssential: false,
    color: "#64748b",
    keywords: [
      "transfer", "neft", "rtgs", "imps", "upi transfer", "self transfer", "internal transfer"
    ],
  },
};

/**
 * Auto-categorizes a transaction based on merchant and description keyword matching.
 */
export function categorizeTransaction(merchant: string, description?: string): CategoryInfo {
  const combined = `${merchant || ""} ${description || ""}`.toLowerCase().trim();

  for (const [categoryName, info] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of info.keywords) {
      if (combined.includes(keyword)) {
        return {
          name: categoryName,
          isEssential: info.isEssential,
          color: info.color,
        };
      }
    }
  }

  return {
    name: "Other",
    isEssential: false,
    color: "#64748b",
  };
}

/**
 * Gets an existing Category record from Prisma database or creates it if not found.
 */
export async function getOrCreateCategory(categoryName: string) {
  const name = categoryName.trim();
  let category = await prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (!category) {
    const meta = CATEGORY_MAP[name] || { isEssential: false, color: "#64748b" };
    category = await prisma.category.create({
      data: {
        name,
        isEssential: meta.isEssential,
        color: meta.color,
      },
    });
  }

  return category;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Robust date parser supporting:
 *  - JavaScript Date objects
 *  - Excel serial numbers (numeric)
 *  - YYYYMMDD (8-digit integer string)
 *  - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 *  - YYYY-MM-DD, YYYY/MM/DD
 *  - DD MMM YYYY, DD-MMM-YYYY (e.g. 01 Jan 2024)
 *  - MMM DD YYYY, MMM-DD-YYYY (e.g. Jan 01 2024)
 *  - ISO 8601 strings
 */
export function parseStatementDate(rawDate: any): Date | null {
  if (rawDate === undefined || rawDate === null || rawDate === "") {
    return null;
  }

  // Handle native JS Date objects (e.g. from XLSX with cellDates:true)
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? null : rawDate;
  }

  // Handle Excel Serial Number (numeric — e.g. 44927)
  if (typeof rawDate === "number") {
    if (isNaN(rawDate) || rawDate <= 0) return null;
    // YYYYMMDD as integer (e.g. 20240115)
    if (rawDate >= 19000101 && rawDate <= 21001231) {
      const s = String(rawDate);
      const year = parseInt(s.slice(0, 4), 10);
      const month = parseInt(s.slice(4, 6), 10) - 1;
      const day = parseInt(s.slice(6, 8), 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    // Excel serial (1900-based)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + rawDate * 86400 * 1000);
    return isNaN(jsDate.getTime()) ? null : jsDate;
  }

  const str = String(rawDate).trim();
  if (!str || str === "Invalid Date") return null;

  // 1. YYYYMMDD string (e.g. "20240115")
  if (/^\d{8}$/.test(str)) {
    const year = parseInt(str.slice(0, 4), 10);
    const month = parseInt(str.slice(4, 6), 10) - 1;
    const day = parseInt(str.slice(6, 8), 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. YYYY-MM-DD or YYYY/MM/DD (ISO-first, unambiguous)
  const ymdMatch = str.match(/^(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    // Validate day/month to avoid treating MM/DD as DD/MM ambiguously
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime()) && d.getDate() === day) return d;
    }
  }

  // 4. DD MMM YYYY or DD-MMM-YYYY (e.g. "01 Jan 2024", "15-Mar-2023")
  const dMonthYearMatch = str.match(/^(\d{1,2})[\s\-\/]([A-Za-z]{3,9})[\s\-\/](\d{4})/);
  if (dMonthYearMatch) {
    const day = parseInt(dMonthYearMatch[1], 10);
    const monthKey = dMonthYearMatch[2].toLowerCase().slice(0, 3);
    const year = parseInt(dMonthYearMatch[3], 10);
    const month = MONTH_NAMES[monthKey] ?? MONTH_NAMES[dMonthYearMatch[2].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 5. MMM DD YYYY or MMM-DD-YYYY (e.g. "Jan 01 2024")
  const monthDYearMatch = str.match(/^([A-Za-z]{3,9})[\s\-\/](\d{1,2})[\s\-\/,]*(\d{4})/);
  if (monthDYearMatch) {
    const monthKey = monthDYearMatch[1].toLowerCase().slice(0, 3);
    const day = parseInt(monthDYearMatch[2], 10);
    const year = parseInt(monthDYearMatch[3], 10);
    const month = MONTH_NAMES[monthKey] ?? MONTH_NAMES[monthDYearMatch[1].toLowerCase()];
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 6. Fallback: native JS Date parser (handles many ISO variants)
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Cleans currency symbols, commas, and parses float amounts safely.
 */
export function parseStatementAmount(rawVal: any): number | null {
  if (rawVal === undefined || rawVal === null || rawVal === "") return null;
  if (typeof rawVal === "number") {
    return isNaN(rawVal) ? null : rawVal;
  }
  const str = String(rawVal).replace(/[₹$,\s]/g, "").trim();
  if (!str) return null;
  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}
