"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Crown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  DollarSign,
  Coins,
} from "lucide-react";
import {
  formatNumber,
  toPersianDigits,
  formatRelativeTime,
  karatLabel,
} from "@/lib/persian";

interface LivePrice {
  karat: string;
  label: string;
  pricePerGram: number;
  changePercent?: number;
  updatedAt: string;
  source: string;
}

interface LiveGoldData {
  prices: LivePrice[];
  coins?: { name: string; price: number; changePercent?: number }[];
  ounce?: { price: number; changePercent?: number };
  dollar?: { price: number; changePercent?: number };
  fetchedAt: string;
  source: string;
}

interface LiveGoldTickerProps {
  variant?: "full" | "compact";
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export function LiveGoldTicker({
  variant = "full",
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes
}: LiveGoldTickerProps) {
  const [data, setData] = React.useState<LiveGoldData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  const fetchPrices = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/gold-prices/live");
      const json = await res.json();
      if (res.ok && json.prices) {
        setData(json);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error fetching live prices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPrices();
    if (autoRefresh) {
      const interval = setInterval(fetchPrices, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <Card className="overflow-hidden border-amber-200 dark:border-amber-900">
        <CardContent className="p-0">
          <div className="flex items-center bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <div className="bg-amber-500 text-white px-3 sm:px-4 py-2 font-bold text-xs sm:text-sm flex items-center gap-2 shrink-0">
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
              <span className="hidden xs:inline">قیمت زنده طلا</span>
              <span className="xs:hidden">طلا</span>
            </div>
            <div className="flex-1 px-4 py-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-sm text-muted-foreground">در حال دریافت قیمت‌های زنده...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const prices = data?.prices || [];
  const isLive = data?.source?.includes("web-search") || data?.source?.includes("mini-service");

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden border-amber-200 dark:border-amber-900">
        <CardContent className="p-0">
          <div className="flex items-center bg-gradient-to-l from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <div className="bg-amber-500 text-white px-3 py-2 font-bold text-xs flex items-center gap-1.5 shrink-0">
              <Crown className="w-3.5 h-3.5" />
              زنده
            </div>
            <ScrollArea className="flex-1">
              <div className="flex items-center gap-4 px-3 py-2 whitespace-nowrap">
                {prices.map((p) => (
                  <div key={p.karat} className="flex items-center gap-1.5 text-xs">
                    <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-[10px] px-1.5">
                      {karatLabel(p.karat)}
                    </Badge>
                    <span className="font-semibold tabular-nums ltr-num">
                      {formatNumber(p.pricePerGram)}
                    </span>
                    {p.changePercent !== undefined && (
                      <span className={`text-[10px] ${p.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {p.changePercent >= 0 ? "▲" : "▼"} {toPersianDigits(Math.abs(p.changePercent))}٪
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-amber-200 dark:border-amber-900">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {/* Header */}
          <div className="bg-gradient-to-l from-amber-500 to-yellow-600 text-white px-3 sm:px-4 py-2 sm:py-2 flex items-center justify-between sm:justify-start gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 shrink-0" />
              <span className="font-bold text-sm">قیمت زنده طلا</span>
            </div>
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                زنده
              </span>
            )}
          </div>

          {/* Prices ticker */}
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 whitespace-nowrap">
              {prices.map((p) => (
                <div key={p.karat} className="flex items-center gap-2 text-sm shrink-0">
                  <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-[10px] px-1.5">
                    {karatLabel(p.karat)}
                  </Badge>
                  <div className="flex flex-col">
                    <span className="font-semibold tabular-nums ltr-num">
                      {formatNumber(p.pricePerGram)}
                      <span className="text-[10px] text-muted-foreground font-normal mr-1">ت/گرم</span>
                    </span>
                  </div>
                  {p.changePercent !== undefined && (
                    <span className={`flex items-center gap-0.5 text-[10px] font-medium ${p.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {p.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {toPersianDigits(Math.abs(p.changePercent))}٪
                    </span>
                  )}
                </div>
              ))}

              {/* Dollar */}
              {data?.dollar && (
                <div className="flex items-center gap-2 text-sm shrink-0 border-r border-amber-200 dark:border-amber-800 pr-4">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  <Badge variant="outline" className="text-[10px] px-1.5">دلار</Badge>
                  <span className="font-semibold tabular-nums ltr-num">
                    {formatNumber(data.dollar.price)}
                  </span>
                </div>
              )}

              {/* Ounce */}
              {data?.ounce && (
                <div className="flex items-center gap-2 text-sm shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <Badge variant="outline" className="text-[10px] px-1.5">اونس</Badge>
                  <span className="font-semibold tabular-nums ltr-num">
                    {formatNumber(data.ounce.price, 2)}
                    <span className="text-[10px] text-muted-foreground font-normal mr-1">$</span>
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Refresh button */}
          <div className="flex items-center gap-2 px-2 sm:px-3 border-t sm:border-t-0 sm:border-r border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPrices}
              disabled={refreshing}
              className="h-8 gap-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "در حال به‌روزرسانی" : "به‌روزرسانی"}</span>
            </Button>
            {lastUpdate && (
              <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(lastUpdate)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
