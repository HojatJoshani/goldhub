/**
 * GoldHub - Live Gold Price Updater Service
 *
 * This mini-service runs in the background and updates gold prices
 * every 30 minutes by fetching from Iranian gold price sources.
 *
 * It calls the GoldHub backend API to save prices to the database.
 * Runs on port 3004 (internal).
 */

import ZAI from "z-ai-web-dev-sdk";

const PORT = 3004;
const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const API_KEY = process.env.GOLD_UPDATER_API_KEY || "goldhub-internal-updater-key";

interface GoldPrice {
  karat: string;
  label: string;
  pricePerGram: number;
  changePercent?: number;
  updatedAt: string;
  source: string;
}

interface LiveGoldData {
  prices: GoldPrice[];
  coins?: { name: string; price: number; changePercent?: number }[];
  ounce?: { price: number; changePercent?: number };
  dollar?: { price: number; changePercent?: number };
  fetchedAt: string;
  source: string;
}

let lastFetchResult: LiveGoldData | null = null;
let lastFetchTime: Date | null = null;
let lastDbUpdate: Date | null = null;
let fetchCount = 0;
let errorCount = 0;
let dbUpdateCount = 0;
let isFetching = false;

/**
 * Fetch live gold prices using z-ai-web-dev-sdk web search
 */
async function fetchLiveGoldPrices(): Promise<LiveGoldData> {
  const zai = await ZAI.create();

  const results = await zai.functions.invoke("web_search", {
    query: "قیمت لحظه ای طلا ۱۸ عیار ۲۴ عیار سکه امیرالمومنین مثقال تومان امروز",
    num: 10,
    recency_days: 1,
  });

  const allText = results
    .map((r: { snippet?: string; name?: string }) => `${r.name} ${r.snippet}`)
    .join(" ");

  const prices = parsePricesFromText(allText);
  const coins = parseCoinsFromText(allText);
  const ounce = parseOunceFromText(allText);
  const dollar = parseDollarFromText(allText);

  return {
    prices,
    coins,
    ounce,
    dollar,
    fetchedAt: new Date().toISOString(),
    source: "mini-service:web-search",
  };
}

function parsePricesFromText(text: string): GoldPrice[] {
  const prices: GoldPrice[] = [];
  const now = new Date().toISOString();

  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[،,]/g, ",");

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
        if (price > 1000000 && price < 100000000) {
          foundPrice = price;
          break;
        }
      }
    }

    if (foundPrice) {
      prices.push({
        karat: p.karat,
        label: p.label,
        pricePerGram: foundPrice,
        updatedAt: now,
        source: "mini-service",
      });
    }
  }

  // Fallback if no prices found
  if (prices.length === 0) {
    const base18 = 17500000;
    prices.push(
      { karat: "999", label: "طلای ۲۴ عیار (۹۹۹)", pricePerGram: Math.round((base18 * 24) / 18), updatedAt: now, source: "fallback" },
      { karat: "916", label: "طلای ۲۲ عیار (۹۱۶)", pricePerGram: Math.round((base18 * 22) / 18), updatedAt: now, source: "fallback" },
      { karat: "750", label: "طلای ۱۸ عیار (۷۵۰)", pricePerGram: base18, updatedAt: now, source: "fallback" },
      { karat: "585", label: "طلای ۱۴ عیار (۵۸۵)", pricePerGram: Math.round((base18 * 14) / 18), updatedAt: now, source: "fallback" }
    );
  }

  return prices;
}

function parseCoinsFromText(text: string): LiveGoldData["coins"] {
  const coins: { name: string; price: number; changePercent?: number }[] = [];
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

  const sekeEmamiRegex = /(?:سکه\s*امامی|امیر\s*المومنین|امیرالمومنین)[^\d]{0,50}?(\d{2,3}(?:,\d{3}){3})/g;
  const sekeMatch = sekeEmamiRegex.exec(normalized);
  if (sekeMatch) {
    const price = parseInt(sekeMatch[1].replace(/,/g, ""));
    if (price > 100000000 && price < 1000000000) {
      coins.push({ name: "سکه امام (ربع)", price, changePercent: undefined });
    }
  }

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

function parseOunceFromText(text: string): LiveGoldData["ounce"] | undefined {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

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

function parseDollarFromText(text: string): LiveGoldData["dollar"] | undefined {
  const normalized = text
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[،,]/g, ",");

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
 * Save prices to database via backend API
 */
async function saveToDatabase(data: LiveGoldData): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/gold-prices/auto-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      const json = await res.json();
      dbUpdateCount++;
      lastDbUpdate = new Date();
      console.log(`✓ ذخیره در دیتابیس: ${json.totalSaved} قیمت برای ${json.tenantsCount} مستاجر`);
      return true;
    } else {
      console.error(`✗ خطا در ذخیره دیتابیس: ${res.status}`);
      return false;
    }
  } catch (error) {
    console.error("✗ خطا در ارتباط با backend:", error);
    return false;
  }
}

/**
 * Main update function
 */
async function updatePrices() {
  if (isFetching) {
    console.log("[updater] در حال به‌روزرسانی است، صبر کنید...");
    return;
  }

  isFetching = true;
  const startTime = Date.now();

  try {
    console.log(`\n[${new Date().toLocaleString("fa-IR")}] شروع به‌روزرسانی قیمت طلا...`);

    const data = await fetchLiveGoldPrices();
    lastFetchResult = data;
    lastFetchTime = new Date();
    fetchCount++;

    console.log(`✓ قیمت‌ها دریافت شد از: ${data.source}`);
    console.log(`✓ تعداد: ${data.prices.length} قیمت`);
    for (const p of data.prices) {
      console.log(`  • ${p.label}: ${p.pricePerGram.toLocaleString("fa-IR")} تومان`);
    }
    if (data.dollar) {
      console.log(`  • دلار: ${data.dollar.price.toLocaleString("fa-IR")} تومان`);
    }
    if (data.ounce) {
      console.log(`  • اونس: $${data.ounce.price}`);
    }

    // Save to database
    await saveToDatabase(data);

    const duration = Date.now() - startTime;
    console.log(`✓ زمان: ${duration}ms`);
    console.log(`✓ مجموع به‌روزرسانی‌ها: ${fetchCount} | ذخیره دیتابیس: ${dbUpdateCount} | خطاها: ${errorCount}`);
  } catch (error) {
    errorCount++;
    console.error(`✗ خطا در به‌روزرسانی (${errorCount}):`, error);
  } finally {
    isFetching = false;
  }
}

/**
 * Simple HTTP server for health check and status
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return Response.json({
      status: "ok",
      service: "gold-price-updater",
      port: PORT,
      backendUrl: BACKEND_URL,
      lastFetch: lastFetchTime?.toISOString() || null,
      lastDbUpdate: lastDbUpdate?.toISOString() || null,
      fetchCount,
      dbUpdateCount,
      errorCount,
      nextUpdate: lastFetchTime
        ? new Date(lastFetchTime.getTime() + UPDATE_INTERVAL_MS).toISOString()
        : "soon",
      lastPrices: lastFetchResult?.prices.map((p) => ({
        karat: p.karat,
        label: p.label,
        price: p.pricePerGram,
        source: p.source,
      })) || [],
      extraData: lastFetchResult
        ? {
            dollar: lastFetchResult.dollar,
            ounce: lastFetchResult.ounce,
            coins: lastFetchResult.coins,
          }
        : null,
    });
  }

  if (url.pathname === "/trigger" && req.method === "POST") {
    await updatePrices();
    return Response.json({
      success: true,
      message: "به‌روزرسانی اجرا شد",
      data: lastFetchResult,
    });
  }

  return new Response(
    `🏆 GoldHub - Gold Price Updater Service

Endpoints:
  GET  /health  - وضعیت سرویس
  POST /trigger  - اجرای دستی به‌روزرسانی

Update interval: every ${UPDATE_INTERVAL_MS / 60000} minutes
Backend: ${BACKEND_URL}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

// Start the service
const server = Bun.serve({
  port: PORT,
  fetch: handleRequest,
});

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🏆 سرویس به‌روزرسانی قیمت زنده طلا - گلد هاب");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📡 پورت: ${PORT}`);
console.log(`⏰ فاصله به‌روزرسانی: هر ${UPDATE_INTERVAL_MS / 60000} دقیقه`);
console.log(`🌐 منبع: جستجوی وب (tgju, iranjib, taline, ...)`);
console.log(`💾 backend: ${BACKEND_URL}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`سرویس روی http://localhost:${PORT} اجرا شد\n`);

// Initial fetch after 5 seconds (let backend start)
setTimeout(() => {
  updatePrices();
}, 5000);

// Schedule periodic updates
setInterval(updatePrices, UPDATE_INTERVAL_MS);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 سرویس متوقف شد");
  server.stop();
  process.exit(0);
});
