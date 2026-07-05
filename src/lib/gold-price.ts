import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export interface LiveGoldPrice {
  karat: string; // 999, 916, 750, 585
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
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache (shorter for fresher data)

/**
 * Normalize Persian/Arabic digits to English and clean text
 */
function normalizeText(text: string): string {
  return text
    // Persian digits
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    // Arabic digits
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    // Persian comma to regular
    .replace(/[،]/g, ",")
    // Non-breaking spaces
    .replace(/\u00A0/g, " ")
    // ZWNJ
    .replace(/\u200C/g, "")
    // Multiple spaces
    .replace(/\s+/g, " ");
}

/**
 * Parse a price string and convert to Toman
 * Handles Rial to Toman conversion (divide by 10)
 * Valid Toman ranges per gram:
 *   18k (750): 14,000,000 - 22,000,000
 *   24k (999): 19,000,000 - 30,000,000
 *   22k (916): 17,000,000 - 26,000,000
 *   14k (585): 11,000,000 - 17,000,000
 */
function parsePriceToToman(
  priceStr: string,
  karat: string
): number | null {
  const cleanStr = priceStr.replace(/[,٬\s]/g, "");
  const price = parseInt(cleanStr);
  if (isNaN(price)) return null;

  // Define valid Toman ranges per karat
  const ranges: Record<string, { min: number; max: number }> = {
    "999": { min: 18000000, max: 35000000 }, // 24k: 18M-35M Toman/g
    "916": { min: 16000000, max: 32000000 }, // 22k
    "750": { min: 13000000, max: 26000000 }, // 18k: 13M-26M Toman/g
    "585": { min: 10000000, max: 20000000 }, // 14k
  };

  const range = ranges[karat];
  if (!range) return null;

  // If price is in valid Toman range, return as-is
  if (price >= range.min && price <= range.max) {
    return price;
  }

  // If price is 10x (Rial), convert to Toman
  const tomanFromRial = Math.round(price / 10);
  if (tomanFromRial >= range.min && tomanFromRial <= range.max) {
    return tomanFromRial;
  }

  // If price is 1000x (might be Rial without proper formatting)
  const tomanFromRial2 = Math.round(price / 1000);
  if (tomanFromRial2 >= range.min && tomanFromRial2 <= range.max) {
    return tomanFromRial2;
  }

  return null;
}

/**
 * Fetch live gold prices from Iranian sources using web search
 * Prices are in Toman per gram
 */
export async function fetchLiveGoldPrices(): Promise<LiveGoldData> {
  // Return cached data if fresh (within 3 minutes)
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  try {
    const zai = await ZAI.create();

    // Search for current gold prices - multiple queries for better coverage
    const [results1, results2] = await Promise.all([
      zai.functions.invoke("web_search", {
        query: "قیمت لحظه ای طلای ۱۸ عیار ۲۴ عیار تومان امروز",
        num: 10,
        recency_days: 1,
      }),
      zai.functions.invoke("web_search", {
        query: "قیمت سکه امیرالمومنین دلار اونس طلا امروز تومان",
        num: 10,
        recency_days: 1,
      }),
    ]);

    // Combine all snippets for parsing
    const allResults = [...(results1 || []), ...(results2 || [])];
    const allText = allResults
      .map(
        (r: { snippet?: string; name?: string }) =>
          `${r.name || ""} ${r.snippet || ""}`
      )
      .join(" ");

    const normalized = normalizeText(allText);

    const prices = parsePricesFromText(normalized);
    const coins = parseCoinsFromText(normalized);
    const ounce = parseOunceFromText(normalized);
    const dollar = parseDollarFromText(normalized);

    // If we got at least 18k and 24k prices, we're good
    const hasMainPrices = prices.some((p) => p.karat === "750") &&
      prices.some((p) => p.karat === "999");

    let finalPrices = prices;
    if (!hasMainPrices) {
      // Try fallback: calculate from whatever we found
      const price18 = prices.find((p) => p.karat === "750");
      const price24 = prices.find((p) => p.karat === "999");

      if (price18 && !price24) {
        // Calculate 24k from 18k: 24/18 = 1.333
        finalPrices = [
          ...prices,
          {
            karat: "999",
            label: "طلای ۲۴ عیار (۹۹۹)",
            pricePerGram: Math.round(price18.pricePerGram * (24 / 18)),
            updatedAt: new Date().toISOString(),
            source: "calculated",
          },
        ];
      } else if (price24 && !price18) {
        // Calculate 18k from 24k: 18/24 = 0.75
        finalPrices = [
          ...prices,
          {
            karat: "750",
            label: "طلای ۱۸ عیار (۷۵۰)",
            pricePerGram: Math.round(price24.pricePerGram * (18 / 24)),
            updatedAt: new Date().toISOString(),
            source: "calculated",
          },
        ];
      }
    }

    // Ensure we have all karats - calculate missing ones from 18k
    const price18 =
      finalPrices.find((p) => p.karat === "750") ||
      finalPrices.find((p) => p.karat === "999");
    if (price18) {
      const base18 = price18.karat === "750"
        ? price18.pricePerGram
        : Math.round(price18.pricePerGram * (18 / 24));

      const karatsToAdd = [
        { karat: "999", label: "طلای ۲۴ عیار (۹۹۹)", ratio: 24 / 18 },
        { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", ratio: 22 / 18 },
        { karat: "750", label: "طلای ۱۸ عیار (۷۵۰)", ratio: 1 },
        { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", ratio: 14 / 18 },
      ];

      for (const k of karatsToAdd) {
        if (!finalPrices.find((p) => p.karat === k.karat)) {
          finalPrices.push({
            karat: k.karat,
            label: k.label,
            pricePerGram: Math.round(base18 * k.ratio),
            updatedAt: new Date().toISOString(),
            source: "calculated-from-18k",
          });
        }
      }
    }

    if (finalPrices.length === 0) {
      return getFallbackPrices();
    }

    const data: LiveGoldData = {
      prices: finalPrices,
      coins,
      ounce,
      dollar,
      fetchedAt: new Date().toISOString(),
      source: "web-search:tgju,tabdeal,goldpricetoday,kifpool",
    };

    // Update cache
    cachedData = data;
    cacheTime = Date.now();

    // Save to database (fire and forget)
    savePricesToDatabase(data).catch(console.error);

    return data;
  } catch (error) {
    console.error("Error fetching live gold prices:", error);
    return getFallbackPrices();
  }
}

/**
 * Parse gold prices from normalized text
 * Extracts prices for 18k, 24k, 22k, 14k gold per gram in Toman
 */
function parsePricesFromText(text: string): LiveGoldPrice[] {
  const prices: LiveGoldPrice[] = [];
  const now = new Date().toISOString();

  // Patterns for each karat - capture prices near "18 عیار" etc.
  // Price format: digits with commas, e.g. "17,706,700" or "17706700"
  const pricePattern = "(\\d{1,3}(?:,\\d{3}){2,4}|\\d{8,9})";

  const patterns: {
    karat: string;
    label: string;
    regexes: RegExp[];
  }[] = [
    {
      karat: "750",
      label: "طلای ۱۸ عیار (۷۵۰)",
      regexes: [
        // "طلای 18 عیار" followed by price within 80 chars
        new RegExp(`طلای?\\s*18\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`گرم\\s*طلای?\\s*18[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`18\\s*عیار\\.?\\s*تومان${pricePattern}`, "g"),
        // tabdeal style: "طلای ۱۸ عیار. تومان17,706,270"
        new RegExp(`18\\s*عیار\\.?\\s*تومان?\\s*${pricePattern}`, "g"),
      ],
    },
    {
      karat: "999",
      label: "طلای ۲۴ عیار (۹۹۹)",
      regexes: [
        new RegExp(`طلای?\\s*24\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`گرم\\s*طلای?\\s*24[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`24\\s*عیار\\.?\\s*تومان?\\s*${pricePattern}`, "g"),
      ],
    },
    {
      karat: "916",
      label: "طلای ۲۲ عیار (۹۱۶)",
      regexes: [
        new RegExp(`طلای?\\s*22\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`22\\s*عیار\\.?\\s*تومان?\\s*${pricePattern}`, "g"),
      ],
    },
    {
      karat: "585",
      label: "طلای ۱۴ عیار (۵۸۵)",
      regexes: [
        new RegExp(`طلای?\\s*14\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`14\\s*عیار\\.?\\s*تومان?\\s*${pricePattern}`, "g"),
      ],
    },
  ];

  for (const p of patterns) {
    let foundPrice: number | null = null;
    let foundChange: number | undefined;

    for (const regex of p.regexes) {
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        // Try each match until we find a valid price
        for (const match of matches) {
          const parsed = parsePriceToToman(match[1], p.karat);
          if (parsed) {
            foundPrice = parsed;

            // Look for change percent near this match (within 200 chars after)
            const afterText = text.substring(
              match.index! + match[0].length,
              match.index! + match[0].length + 200
            );
            const changeMatch = afterText.match(
              /(?:\+|-)?(\d+\.?\d*)\s*(?:%|درصد)/
            );
            if (changeMatch) {
              foundChange = parseFloat(changeMatch[1]);
              // Check if it's negative
              if (afterText.includes("-") || afterText.includes("کاهش")) {
                foundChange = -foundChange;
              }
            }
            break;
          }
        }
      }
      if (foundPrice) break;
    }

    if (foundPrice) {
      prices.push({
        karat: p.karat,
        label: p.label,
        pricePerGram: foundPrice,
        changePercent: foundChange,
        updatedAt: now,
        source: "web-search",
      });
    }
  }

  return prices;
}

/**
 * Parse coin prices (skeleton coin - سکه امامی)
 * Price range: 100M - 250M Toman for full coin
 */
function parseCoinsFromText(text: string): LiveGoldData["coins"] {
  const coins: { name: string; price: number; changePercent?: number }[] = [];

  // سکه امامی / امیرالمومنین - full coin (100M-250M Toman)
  const sekeRegex = /(?:سکه\s*امامی|امیر\s*المومنین|امیرالمومنین)[^\d]{0,80}?(\d{2,3}(?:,\d{3}){3,4}|\d{9,11})/g;
  const sekeMatch = sekeRegex.exec(text);
  if (sekeMatch) {
    let price = parseInt(sekeMatch[1].replace(/[,]/g, ""));
    // Validate: 100M-300M Toman
    if (price > 10000000 && price < 100000000) {
      // Might be in thousands of Toman (e.g., "186,400m" = 186,400,000)
      price = price * 1000;
    }
    if (price >= 100000000 && price <= 300000000) {
      coins.push({ name: "سکه امام (یک بهار)", price, changePercent: undefined });
    }
  }

  // نیم سکه - half coin (50M-150M Toman)
  const nimRegex = /نیم\s*سکه[^\d]{0,80}?(\d{2,3}(?:,\d{3}){3,4}|\d{9,11})/g;
  const nimMatch = nimRegex.exec(text);
  if (nimMatch) {
    let price = parseInt(nimMatch[1].replace(/[,]/g, ""));
    if (price >= 50000000 && price <= 150000000) {
      coins.push({ name: "نیم سکه", price, changePercent: undefined });
    }
  }

  return coins.length > 0 ? coins : undefined;
}

/**
 * Parse ounce (اونس) price in USD
 * Range: 2000-5000 USD
 */
function parseOunceFromText(text: string): LiveGoldData["ounce"] | undefined {
  // Collect ALL matches and return the best one in valid range
  const ounceRegex = /(?:اونس|انس)\s*(?:طلا)?[^\d]{0,80}?(\d{1,2}[,]\d{3}(?:\.\d{1,2})?|\d{4}(?:\.\d{1,2})?)/g;
  const matches = [...text.matchAll(ounceRegex)];
  for (const match of matches) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price >= 3500 && price <= 5000) {
      return { price, changePercent: undefined };
    }
  }
  // Try broader pattern: "4,175.16" format anywhere near ounce keyword
  const broadRegex = /(?:اونس|انس)[^\d]{0,120}?(\d[,\d]{4,}(?:\.\d{1,2})?)/g;
  const broadMatches = [...text.matchAll(broadRegex)];
  for (const match of broadMatches) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price >= 3500 && price <= 5000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

/**
 * Parse dollar price in Toman
 * Range: 100,000-200,000 Toman (current market)
 */
function parseDollarFromText(text: string): LiveGoldData["dollar"] | undefined {
  // Collect ALL matches and return the best one in valid range
  const dollarRegex = /(?:دلار\s*(?:آمریکا|آزاد)?|دلار)[^\d]{0,80}?(\d{3}(?:,\d{3}){1,2}|\d{6})/g;
  const matches = [...text.matchAll(dollarRegex)];
  for (const match of matches) {
    const price = parseInt(match[1].replace(/,/g, ""));
    if (price >= 100000 && price <= 250000) {
      return { price, changePercent: undefined };
    }
  }
  // Try without comma format: "175400"
  const plainRegex = /دلار[^\d]{0,30}?(\d{6})/g;
  const plainMatches = [...text.matchAll(plainRegex)];
  for (const match of plainMatches) {
    const price = parseInt(match[1]);
    if (price >= 100000 && price <= 250000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

/**
 * Fallback prices when web search fails
 * These are approximate and should be updated
 */
function getFallbackPrices(): LiveGoldData {
  const now = new Date().toISOString();
  // Approximate current prices (will be overridden by live data when available)
  const base18 = 17700000; // ~17.7M Toman per gram for 18k
  return {
    prices: [
      { karat: "999", label: "طلای ۲۴ عیار (۹۹۹)", pricePerGram: Math.round((base18 * 24) / 18), updatedAt: now, source: "fallback" },
      { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", pricePerGram: Math.round((base18 * 22) / 18), updatedAt: now, source: "fallback" },
      { karat: "750", label: "طلای ۱۸ عیار (۷۵۰)", pricePerGram: base18, updatedAt: now, source: "fallback" },
      { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", pricePerGram: Math.round((base18 * 14) / 18), updatedAt: now, source: "fallback" },
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
    // Ignore DB errors (e.g., on Vercel)
  }
}
