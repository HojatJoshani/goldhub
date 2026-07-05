import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

export interface LiveGoldPrice {
  karat: string;
  label: string;
  pricePerGram: number; // in Toman
  changePercent?: number;
  changeAmount?: number;
  high?: number;
  low?: number;
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
    price: number;
    changePercent?: number;
  };
  dollar?: {
    price: number;
    changePercent?: number;
  };
  fetchedAt: string;
  source: string;
}

let cachedData: LiveGoldData | null = null;
let cacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

/**
 * Fetch live gold prices from multiple Iranian sources
 */
export async function fetchLiveGoldPrices(): Promise<LiveGoldData> {
  // Return cached data if fresh (within 2 minutes)
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  try {
    // Method 1: Try direct TGJU scrape (most reliable)
    const tgjuData = await fetchFromTgjuDirect();
    if (tgjuData.prices.length >= 2) {
      cachedData = tgjuData;
      cacheTime = Date.now();
      savePricesToDatabase(tgjuData).catch(() => {});
      return tgjuData;
    }

    // Method 2: Fallback to web search
    const searchData = await fetchFromWebSearch();
    if (searchData.prices.length >= 2) {
      cachedData = searchData;
      cacheTime = Date.now();
      savePricesToDatabase(searchData).catch(() => {});
      return searchData;
    }

    // Method 3: Return cached data even if stale
    if (cachedData) {
      return cachedData;
    }

    // Method 4: Fallback static prices
    return getFallbackPrices();
  } catch (error) {
    console.error("Error fetching live gold prices:", error);
    if (cachedData) return cachedData;
    return getFallbackPrices();
  }
}

/**
 * Method 1: Direct TGJU scrape
 * TGJU is the most reliable Iranian gold price source
 */
async function fetchFromTgjuDirect(): Promise<LiveGoldData> {
  const now = new Date().toISOString();
  const prices: LiveGoldPrice[] = [];

  try {
    // Fetch 18k and 24k pages
    const [page18, page24] = await Promise.all([
      fetchTgjuPage("geram18"),
      fetchTgjuPage("geram24"),
    ]);

    const price18 = extractTgjuPrice(page18);
    const price24 = extractTgjuPrice(page24);

    if (price18) {
      prices.push({
        karat: "750",
        label: "طلای ۱۸ عیار (۷۵۰)",
        pricePerGram: price18,
        updatedAt: now,
        source: "tgju-direct",
      });
    }

    if (price24) {
      prices.push({
        karat: "999",
        label: "طلای ۲۴ عیار (۹۹۹)",
        pricePerGram: price24,
        updatedAt: now,
        source: "tgju-direct",
      });
    }

    // Calculate other karats
    if (price18) {
      const base18 = price18;
      const karatsToAdd = [
        { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", ratio: 22 / 18 },
        { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", ratio: 14 / 18 },
      ];
      for (const k of karatsToAdd) {
        if (!prices.find((p) => p.karat === k.karat)) {
          prices.push({
            karat: k.karat,
            label: k.label,
            pricePerGram: Math.round(base18 * k.ratio),
            updatedAt: now,
            source: "calculated-from-18k",
          });
        }
      }
    }

    // Also try to get dollar and ounce from TGJU
    const dollar = await fetchTgjuDollar();
    const ounce = await fetchTgjuOunce();

    return {
      prices,
      dollar,
      ounce,
      fetchedAt: now,
      source: "tgju.org-direct",
    };
  } catch (error) {
    console.error("TGJU direct fetch failed:", error);
    return { prices: [], fetchedAt: now, source: "tgju-failed" };
  }
}

/**
 * Fetch a TGJU profile page
 */
async function fetchTgjuPage(profile: string): Promise<string> {
  try {
    const res = await fetch(`https://www.tgju.org/profile/${profile}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
        "Accept-Language": "fa,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch {
    return "";
  }
}

/**
 * Extract price from TGJU page HTML
 * TGJU shows prices in Rial - convert to Toman (divide by 10)
 */
function extractTgjuPrice(html: string): number | null {
  if (!html) return null;

  // TGJU has data in format like: "176,843,00" (which is 17,684,300 Rial = 1,768,430 Toman... no)
  // Actually "176,843,00" is displayed as 17,684,300,00 Rial... let me parse properly
  // Looking at the page: "نرخ فعلی" row contains the current price
  // The values are in Rial, displayed with Persian formatting

  // Pattern: find numbers like "17,684,300" or "17684300" near "نرخ فعلی"
  const patterns = [
    // Standard format: 17,684,300 (Toman) or 176,843,00 (Rial short)
    /نرخ فعلی[^0-9]{0,200}?(\d{1,3}(?:,\d{3}){1,3}(?:,\d{1,2})?)/,
    // data-value attribute
    /data-value="(\d{8,12})"/,
    // Any large number that looks like gold price
    /(\d{2,3}(?:,\d{3}){2,3})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, "");
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        // Convert to Toman
        const toman = rialToToman(num);
        // Validate: 18k should be 13M-26M Toman, 24k should be 18M-35M Toman
        if (toman >= 13000000 && toman <= 35000000) {
          return toman;
        }
      }
    }
  }

  return null;
}

/**
 * Convert Rial to Toman
 * Handles various formats:
 * - 176843000 Rial -> 17684300 Toman (divide by 10)
 * - 17684300 (already might be Toman)
 */
function rialToToman(rial: number): number {
  // If it's a 9-digit number (e.g., 176843000), it's Rial -> divide by 10
  if (rial >= 100000000 && rial < 1000000000) {
    return Math.round(rial / 10);
  }
  // If it's 8 digits (e.g., 17684300), might be Toman already
  if (rial >= 10000000 && rial < 100000000) {
    return rial;
  }
  // Try dividing by 10 as fallback
  const toman = Math.round(rial / 10);
  return toman;
}

/**
 * Fetch dollar price from TGJU
 */
async function fetchTgjuDollar(): Promise<LiveGoldData["dollar"] | undefined> {
  try {
    const html = await fetchTgjuPage("usd");
    if (!html) return undefined;

    // Dollar is around 100,000-200,000 Toman
    const match = html.match(/(?:دلار|usd)[^0-9]{0,300}?(\d{3}(?:,\d{3}){1,2})/i);
    if (match) {
      const price = parseInt(match[1].replace(/,/g, ""));
      // Convert to Toman if needed (TGJU shows Rial)
      const toman = price >= 1000000 ? Math.round(price / 10) : price;
      if (toman >= 100000 && toman <= 250000) {
        return { price: toman, changePercent: undefined };
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetch ounce price from TGJU
 */
async function fetchTgjuOunce(): Promise<LiveGoldData["ounce"] | undefined> {
  try {
    const html = await fetchTgjuPage("ons");
    if (!html) return undefined;

    // Ounce is around 2000-5000 USD
    const match = html.match(/(?:اونس|انس|ounce)[^0-9]{0,300}?(\d{1,2}[,]\d{3}(?:\.\d{1,2})?|\d{4}(?:\.\d{1,2})?)/i);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price >= 3000 && price <= 5000) {
        return { price, changePercent: undefined };
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Method 2: Web search fallback
 */
async function fetchFromWebSearch(): Promise<LiveGoldData> {
  const now = new Date().toISOString();

  try {
    const zai = await ZAI.create();

    const [results1, results2] = await Promise.all([
      zai.functions.invoke("web_search", {
        query: "قیمت لحظه ای طلای ۱۸ عیار ۲۴ عیار تومان امروز",
        num: 10,
        recency_days: 1,
      }),
      zai.functions.invoke("web_search", {
        query: "قیمت سکه دلار اونس طلا امروز تومان",
        num: 10,
        recency_days: 1,
      }),
    ]);

    const allResults = [...(results1 || []), ...(results2 || [])];
    const allText = allResults
      .map((r: { snippet?: string; name?: string }) => `${r.name || ""} ${r.snippet || ""}`)
      .join(" ");

    const normalized = normalizeText(allText);
    const prices = parsePricesFromSearch(normalized);
    const coins = parseCoinsFromSearch(normalized);
    const ounce = parseOunceFromSearch(normalized);
    const dollar = parseDollarFromSearch(normalized);

    // Calculate missing karats from 18k
    const price18 = prices.find((p) => p.karat === "750");
    if (price18) {
      const base18 = price18.pricePerGram;
      const karatsToAdd = [
        { karat: "999", label: "طلای ۲۴ عیار (۹۹۹)", ratio: 24 / 18 },
        { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", ratio: 22 / 18 },
        { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", ratio: 14 / 18 },
      ];
      for (const k of karatsToAdd) {
        if (!prices.find((p) => p.karat === k.karat)) {
          prices.push({
            karat: k.karat,
            label: k.label,
            pricePerGram: Math.round(base18 * k.ratio),
            updatedAt: now,
            source: "calculated",
          });
        }
      }
    }

    return {
      prices,
      coins,
      ounce,
      dollar,
      fetchedAt: now,
      source: prices.length > 0 ? "web-search:tgju,tabdeal,taline" : "web-search-failed",
    };
  } catch (error) {
    console.error("Web search failed:", error);
    return { prices: [], fetchedAt: now, source: "web-search-error" };
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[،]/g, ",")
    .replace(/\u00A0/g, " ")
    .replace(/\u200C/g, "")
    .replace(/\s+/g, " ");
}

function parsePricesFromSearch(text: string): LiveGoldPrice[] {
  const prices: LiveGoldPrice[] = [];
  const now = new Date().toISOString();
  const pricePattern = "(\\d{1,3}(?:,\\d{3}){2,4}|\\d{8,9})";

  const patterns: { karat: string; label: string; regexes: RegExp[] }[] = [
    {
      karat: "750",
      label: "طلای ۱۸ عیار (۷۵۰)",
      regexes: [
        new RegExp(`طلای?\\s*18\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`گرم\\s*طلای?\\s*18[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`18\\s*عیار\\.?\\s*تومان?\\s*${pricePattern}`, "g"),
      ],
    },
    {
      karat: "999",
      label: "طلای ۲۴ عیار (۹۹۹)",
      regexes: [
        new RegExp(`طلای?\\s*24\\s*عیار[^\\d]{0,80}?${pricePattern}`, "g"),
        new RegExp(`گرم\\s*طلای?\\s*24[^\\d]{0,80}?${pricePattern}`, "g"),
      ],
    },
  ];

  for (const p of patterns) {
    let foundPrice: number | null = null;

    for (const regex of p.regexes) {
      const matches = [...text.matchAll(regex)];
      if (matches.length > 0) {
        for (const match of matches) {
          const parsed = parsePriceToToman(match[1], p.karat);
          if (parsed) {
            foundPrice = parsed;
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
        updatedAt: now,
        source: "web-search",
      });
    }
  }

  return prices;
}

function parsePriceToToman(priceStr: string, karat: string): number | null {
  const cleanStr = priceStr.replace(/[,٬\s]/g, "");
  const price = parseInt(cleanStr);
  if (isNaN(price)) return null;

  const ranges: Record<string, { min: number; max: number }> = {
    "999": { min: 18000000, max: 35000000 },
    "750": { min: 13000000, max: 26000000 },
  };
  const range = ranges[karat];
  if (!range) return null;

  if (price >= range.min && price <= range.max) return price;
  const tomanFromRial = Math.round(price / 10);
  if (tomanFromRial >= range.min && tomanFromRial <= range.max) return tomanFromRial;
  return null;
}

function parseCoinsFromSearch(text: string): LiveGoldData["coins"] {
  const coins: { name: string; price: number; changePercent?: number }[] = [];
  const sekeRegex = /(?:سکه\s*امامی|امیر\s*المومنین|امیرالمومنین)[^\d]{0,80}?(\d{2,3}(?:,\d{3}){3,4}|\d{9,11})/g;
  const sekeMatch = sekeRegex.exec(text);
  if (sekeMatch) {
    let price = parseInt(sekeMatch[1].replace(/[,]/g, ""));
    if (price > 10000000 && price < 100000000) {
      price = price * 1000;
    }
    if (price >= 100000000 && price <= 300000000) {
      coins.push({ name: "سکه امام (یک بهار)", price, changePercent: undefined });
    }
  }
  return coins.length > 0 ? coins : undefined;
}

function parseOunceFromSearch(text: string): LiveGoldData["ounce"] | undefined {
  const ounceRegex = /(?:اونس|انس)\s*(?:طلا)?[^\d]{0,80}?(\d{1,2}[,]\d{3}(?:\.\d{1,2})?|\d{4}(?:\.\d{1,2})?)/g;
  const matches = [...text.matchAll(ounceRegex)];
  for (const match of matches) {
    const price = parseFloat(match[1].replace(/,/g, ""));
    if (price >= 3500 && price <= 5000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

function parseDollarFromSearch(text: string): LiveGoldData["dollar"] | undefined {
  const dollarRegex = /(?:دلار\s*(?:آمریکا|آزاد)?|دلار)[^\d]{0,80}?(\d{3}(?:,\d{3}){1,2}|\d{6})/g;
  const matches = [...text.matchAll(dollarRegex)];
  for (const match of matches) {
    const price = parseInt(match[1].replace(/,/g, ""));
    if (price >= 100000 && price <= 250000) {
      return { price, changePercent: undefined };
    }
  }
  return undefined;
}

/**
 * Fallback prices (updated periodically)
 */
function getFallbackPrices(): LiveGoldData {
  const now = new Date().toISOString();
  const base18 = 17700000; // ~17.7M Toman per gram (update this)
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
  } catch {
    // Ignore DB errors
  }
}
