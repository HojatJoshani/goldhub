import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export interface LiveGoldPrice {
  karat: string; // 24, 22, 18, 14, 999, 916, 750, 585
  label: string; // Persian label
  pricePerGram: number; // in Toman
  changePercent?: number; // daily change %
  changeAmount?: number; // daily change amount
  high?: number; // daily high
  low?: number; // daily low
  updatedAt: string;
  source: string;
}

export interface LiveGoldData {
  prices: LiveGoldPrice[];
  coins?: {
    name: string;
    price: number;
    changePercent?: number;
  }[];
  ounce?: {
    price: number; // in USD
    changePercent?: number;
  };
  dollar?: {
    price: number; // in Toman
    changePercent?: number;
  };
  fetchedAt: string;
  source: string;
}

let cachedData: LiveGoldData | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch live gold prices from Iranian sources using web search
 * Prices are in Toman per gram
 */
export async function fetchLiveGoldPrices(): Promise<LiveGoldData> {
  // Return cached data if fresh (within 5 minutes)
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  try {
    const zai = await ZAI.create();

    // Search for current gold prices
    const results = await zai.functions.invoke("web_search", {
      query: "قیمت لحظه ای طلا ۱۸ عیار ۲۴ عیار سکه امیرالمومنین مثقال تومان امروز",
      num: 10,
      recency_days: 1,
    });

    // Combine all snippets for parsing
    const allText = results
      .map((r: { snippet?: string; name?: string }) => `${r.name} ${r.snippet}`)
      .join(" ");

    const prices = parsePricesFromText(allText);
    const coins = parseCoinsFromText(allText);
    const ounce = parseOunceFromText(allText);
    const dollar = parseDollarFromText(allText);

    const data: LiveGoldData = {
      prices,
      coins,
      ounce,
      dollar,
      fetchedAt: new Date().toISOString(),
      source: "web-search:tgju,iranjib,taline,alanchand",
    };

    // Update cache
    cachedData = data;
    cacheTime = Date.now();

    // Save to database (fire and forget)
    savePricesToDatabase(data).catch(console.error);

    return data;
  } catch (error) {
    console.error("Error fetching live gold prices:", error);
    // Return fallback data if fetch fails
    return getFallbackPrices();
  }
}

/**
 * Parse gold prices from text snippets
 */
function parsePricesFromText(text: string): LiveGoldPrice[] {
  const prices: LiveGoldPrice[] = [];
  const now = new Date().toISOString();

  // Normalize Persian/Arabic digits to English
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[،,]/g, ",");

  // Price patterns for different karats
  // Looking for patterns like "طلای 18 عیار 17,611,000" or "18 عیار ... 17,611,000"
  const patterns: { karat: string; label: string; regexes: RegExp[] }[] = [
    {
      karat: "750",
      label: "طلای ۱۸ عیار (۷۵۰)",
      regexes: [
        /18\s*عیار[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /عیار\s*18[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /گرم\s*طلای\s*18[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
      ],
    },
    {
      karat: "999",
      label: "طلای ۲۴ عیار (۹۹۹)",
      regexes: [
        /24\s*عیار[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /عیار\s*24[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /گرم\s*طلای\s*24[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
      ],
    },
    {
      karat: "916",
      label: "طلای ۲۲ عیار (۹۱۶)",
      regexes: [
        /22\s*عیار[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /عیار\s*22[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
      ],
    },
    {
      karat: "585",
      label: "طلای ۱۴ عیار (۵۸۵)",
      regexes: [
        /14\s*عیار[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
        /عیار\s*14[^\d]{0,50}?(\d{1,3}(?:,\d{3}){2,4})/g,
      ],
    },
  ];

  for (const p of patterns) {
    let foundPrice: number | null = null;
    for (const regex of p.regexes) {
      const matches = [...normalized.matchAll(regex)];
      if (matches.length > 0) {
        const priceStr = matches[0][1].replace(/,/g, "");
        const price = parseInt(priceStr);
        // Validate: gold gram price should be between 1M and 100M Toman
        if (price > 1000000 && price < 100000000) {
          foundPrice = price;
          break;
        }
      }
    }

    if (foundPrice) {
      // Try to find change percent near this price
      const changeRegex = new RegExp(
        `${p.karat === "750" ? "18" : p.karat === "999" ? "24" : p.karat === "916" ? "22" : "14"}[^%]{0,100}?(\\d+\\.?\\d*)\\s*%`,
        "g"
      );
      const changeMatch = changeRegex.exec(normalized);
      const changePercent = changeMatch
        ? parseFloat(changeMatch[1])
        : undefined;

      prices.push({
        karat: p.karat,
        label: p.label,
        pricePerGram: foundPrice,
        changePercent,
        updatedAt: now,
        source: "web-search",
      });
    }
  }

  // If no prices found, use fallback
  if (prices.length === 0) {
    return getFallbackPrices().prices;
  }

  return prices;
}

/**
 * Parse coin prices from text
 */
function parseCoinsFromText(text: string): LiveGoldData["coins"] {
  const coins: { name: string; price: number; changePercent?: number }[] = [];
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

  // سکه امامی / امیرالمومنین
  const sekeEmamiRegex = /(?:سکه\s*امامی|امیر\s*المومنین|امیرالمومنین)[^\d]{0,50}?(\d{2,3}(?:,\d{3}){3})/g;
  const sekeMatch = sekeEmamiRegex.exec(normalized);
  if (sekeMatch) {
    const price = parseInt(sekeMatch[1].replace(/,/g, ""));
    if (price > 100000000 && price < 1000000000) {
      coins.push({ name: "سکه امام (ربع)", price, changePercent: undefined });
    }
  }

  // نیم سکه
  const nimSekeRegex = /نیم\s*سکه[^\d]{0,50}?(\d{2,3}(?:,\d{3}){3})/g;
  const nimMatch = nimSekeRegex.exec(normalized);
  if (nimMatch) {
    const price = parseInt(nimMatch[1].replace(/,/g, ""));
    if (price > 50000000 && price < 500000000) {
      coins.push({ name: "نیم سکه", price, changePercent: undefined });
    }
  }

  return coins.length > 0 ? coins : undefined;
}

/**
 * Parse ounce price from text
 */
function parseOunceFromText(text: string): LiveGoldData["ounce"] | undefined {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

  // اونس جهانی ~ 2000-3500 USD
  const ounceRegex = /اونس[^\d]{0,50}?(\d{3,4}(?:\.\d{1,2})?)/g;
  const match = ounceRegex.exec(normalized);
  if (match) {
    const price = parseFloat(match[1]);
    if (price > 1000 && price < 5000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

/**
 * Parse dollar price from text
 */
function parseDollarFromText(text: string): LiveGoldData["dollar"] | undefined {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

  // دلار ~ 60000-150000 Toman
  const dollarRegex = /(?:دلار|دلار\s*آزاد)[^\d]{0,50}?(\d{2,3}(?:,\d{3}){1,2})/g;
  const match = dollarRegex.exec(normalized);
  if (match) {
    const price = parseInt(match[1].replace(/,/g, ""));
    if (price > 50000 && price < 200000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

/**
 * Fallback prices when web search fails (approximate, will be updated)
 */
function getFallbackPrices(): LiveGoldData {
  const now = new Date().toISOString();
  // Approximate prices based on recent market (July 2025)
  const base18 = 17500000; // per gram
  return {
    prices: [
      { karat: "999", label: "طلای ۲۴ عیار (۹۹۹)", pricePerGram: Math.round(base18 * 24 / 18), updatedAt: now, source: "fallback" },
      { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", pricePerGram: Math.round(base18 * 22 / 18), updatedAt: now, source: "fallback" },
      { karat: "750", label: "طلای ۱۸ عیار (۷۵۰)", pricePerGram: base18, updatedAt: now, source: "fallback" },
      { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", pricePerGram: Math.round(base18 * 14 / 18), updatedAt: now, source: "fallback" },
    ],
    fetchedAt: now,
    source: "fallback",
  };
}

/**
 * Save fetched prices to database for all tenants
 */
async function savePricesToDatabase(data: LiveGoldData): Promise<void> {
  try {
    const tenants = await db.tenant.findMany({ select: { id: true } });

    for (const tenant of tenants) {
      for (const price of data.prices) {
        await db.goldPrice.create({
          data: {
            tenantId: tenant.id,
            karat: price.karat,
            pricePerGram: price.pricePerGram,
            currency: "IRR",
            source: `live:${data.source}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error saving prices to database:", error);
  }
}

/**
 * Get latest prices from database (for history)
 */
export async function getLatestPricesFromDb(tenantId: string, limit = 50) {
  return db.goldPrice.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get price history for a specific karat
 */
export async function getPriceHistory(
  tenantId: string,
  karat: string,
  days = 30
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const prices = await db.goldPrice.findMany({
    where: {
      tenantId,
      karat,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "asc" },
    select: {
      pricePerGram: true,
      createdAt: true,
      source: true,
    },
  });

  return prices;
}
