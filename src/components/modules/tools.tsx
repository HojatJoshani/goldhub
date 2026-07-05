"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  FileText,
  RotateCcw,
  Printer,
  Package,
  Calculator,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import {
  formatToman,
  formatNumber,
  toPersianDigits,
  formatPersianDate,
  formatRelativeTime,
} from "@/lib/persian";
import { TaxPanel } from "@/components/tax-panel";
import { BarcodeSvg, BarcodePrintSheet } from "@/components/barcode-print";
import { toast } from "sonner";

interface ReturnItem {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  customer: { name: string; phone: string | null } | null;
  cashier: { name: string };
  items: { id: string; name: string; quantity: number; total: number }[];
}

interface BarcodeProduct {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  salePrice: number;
  karat: string;
  weight: number;
}

export function ToolsModule() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
          ابزارهای طلافروشی
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          مودیان مالیاتی، مرجوعی کالا، چاپ بارکد و ابزارهای مورد نیاز طلافروشی
        </p>
      </div>

      <Tabs defaultValue="tax" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tax" className="text-xs sm:text-sm">
            <FileText className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">مودیان و مالیات</span>
            <span className="sm:hidden">مالیات</span>
          </TabsTrigger>
          <TabsTrigger value="returns" className="text-xs sm:text-sm">
            <RotateCcw className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">مرجوعی کالا</span>
            <span className="sm:hidden">مرجوعی</span>
          </TabsTrigger>
          <TabsTrigger value="barcode" className="text-xs sm:text-sm">
            <Printer className="w-3.5 h-3.5 sm:ml-1" />
            <span className="hidden sm:inline">چاپ بارکد</span>
            <span className="sm:hidden">بارکد</span>
          </TabsTrigger>
        </TabsList>

        {/* Tax Tab */}
        <TabsContent value="tax" className="mt-4">
          <TaxPanel />
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="mt-4">
          <ReturnsTab />
        </TabsContent>

        {/* Barcode Tab */}
        <TabsContent value="barcode" className="mt-4">
          <BarcodeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReturnsTab() {
  const [returns, setReturns] = React.useState<ReturnItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalRefundAmount: 0,
    totalRefundCount: 0,
    avgRefundAmount: 0,
  });

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/returns?pageSize=50");
      const json = await res.json();
      if (res.ok) {
        setReturns(json.items || []);
        setStats(json.stats || { totalRefundAmount: 0, totalRefundCount: 0, avgRefundAmount: 0 });
      }
    } catch (error) {
      console.error("Returns load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">کل مرجوعی‌ها</p>
            <p className="text-lg font-bold tabular-nums ltr-num">
              {formatNumber(stats.totalRefundAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">تعداد مرجوعی</p>
            <p className="text-lg font-bold tabular-nums">
              {toPersianDigits(stats.totalRefundCount)}
            </p>
            <p className="text-[10px] text-muted-foreground">مورد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">میانگین مرجوعی</p>
            <p className="text-lg font-bold tabular-nums ltr-num">
              {formatNumber(stats.avgRefundAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>
      </div>

      {/* Returns list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">لیست مرجوعی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-3">
              {returns.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-medium">{r.invoiceNumber}</span>
                        <Badge variant="destructive">مرجوعی</Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {r.paymentMethod === "cash" ? "نقدی" : r.paymentMethod === "card" ? "کارتی" : r.paymentMethod}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.customer?.name || "مشتری متفرقه"} · {r.cashier.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatPersianDate(r.createdAt)} · {formatRelativeTime(r.createdAt)}
                      </p>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{r.notes}</p>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="font-bold text-red-600 tabular-nums ltr-num">
                        {formatNumber(r.total)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">تومان</p>
                    </div>
                  </div>
                  {r.items.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      اقلام: {r.items.map((i) => `${i.name} (${toPersianDigits(i.quantity)})`).join("، ")}
                    </div>
                  )}
                </div>
              ))}
              {returns.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">هیچ مرجوعی ثبت نشده است</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function BarcodeTab() {
  const [products, setProducts] = React.useState<BarcodeProduct[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/barcode?all=true");
      const json = await res.json();
      if (res.ok) setProducts(json.products || []);
    } catch (error) {
      console.error("Barcode load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = products.filter(
    (p) =>
      p.name.includes(search) ||
      p.barcode.includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedProducts = products.filter((p) => selected.has(p.id));

  const handlePrint = () => {
    if (selectedProducts.length === 0) {
      toast.error("حداقل یک محصول انتخاب کنید");
      return;
    }
    // Render print sheet and trigger print
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("باز کردن پنجره چاپ مسدود شد");
      return;
    }
    printWindow.document.write(`
      <html dir="rtl" lang="fa">
        <head>
          <title>چاپ بارکد</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; margin: 10mm; }
            .label {
              width: 30%;
              display: inline-block;
              padding: 8px;
              margin: 4px;
              border: 1px dashed #999;
              vertical-align: top;
              text-align: center;
            }
            .label-name { font-size: 11px; margin-bottom: 4px; height: 30px; overflow: hidden; }
            .label-price { font-size: 12px; font-weight: bold; margin-top: 4px; }
            .label-brand { font-size: 10px; color: #666; margin-bottom: 2px; }
            @page { size: A4; margin: 8mm; }
          </style>
        </head>
        <body>
          ${selectedProducts
            .map(
              (p) => `
            <div class="label">
              <div class="label-brand">گلد هاب</div>
              <div class="label-name">${p.name}</div>
              <svg width="180" height="50" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="white" />
                ${generateBarcodeSvg(p.barcode)}
                <text x="50%" y="55" text-anchor="middle" font-size="10" font-family="monospace">${p.barcode}</text>
              </svg>
              <div class="label-price">${p.salePrice.toLocaleString("fa-IR")} ت</div>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-500" />
                چاپ بارکد محصولات
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {toPersianDigits(filtered.length)} محصول · {toPersianDigits(selected.size)} انتخاب شده
              </CardDescription>
            </div>
            <Button
              onClick={handlePrint}
              disabled={selected.size === 0}
              className="gold-gradient text-white gap-2"
              size="sm"
            >
              <Printer className="w-4 h-4" />
              چاپ بارکدها
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/60 text-sm mb-4">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              placeholder="جستجو با نام، بارکد یا SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto scrollbar-thin">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`p-3 rounded-lg border-2 text-right transition-all ${
                  selected.has(p.id)
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                    : "border-border hover:border-amber-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                  {selected.has(p.id) && (
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs font-medium mb-2 line-clamp-2 h-8">{p.name}</p>
                <div className="flex justify-center mb-2">
                  <BarcodeSvg value={p.barcode} width={120} height={35} showText={false} />
                </div>
                <p className="text-[10px] text-muted-foreground text-center font-mono">{p.barcode}</p>
                <p className="text-xs font-bold text-center mt-1 tabular-nums ltr-num">
                  {formatNumber(p.salePrice)}
                </p>
                <p className="text-[10px] text-muted-foreground text-center">تومان</p>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              محصولی یافت نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function generateBarcodeSvg(value: string): string {
  // Generate SVG bars for barcode
  let svg = "";
  const bars: number[] = [];
  // Start guard
  bars.push(2, 1, 2);
  // Encode each char
  for (const char of value) {
    const code = char.charCodeAt(0);
    const pattern = (code * 7 + 3) % 64;
    for (let i = 0; i < 6; i++) {
      const isOn = (pattern >> i) & 1;
      bars.push(isOn ? 2 : 1);
    }
  }
  // End guard
  bars.push(2, 1, 3);

  let x = 10;
  bars.forEach((width, i) => {
    if (i % 2 === 0) {
      svg += `<rect x="${x}" y="5" width="${width}" height="35" fill="black" />`;
    }
    x += width + 1;
  });
  return svg;
}
