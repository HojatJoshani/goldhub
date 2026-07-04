"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScrollArea,
} from "@/components/ui/scroll-area";
import {
  FileText,
  Calculator,
  TrendingUp,
  Download,
  Printer,
  Crown,
  Percent,
  Receipt,
  AlertCircle,
} from "lucide-react";
import {
  formatToman,
  formatNumber,
  toPersianDigits,
  formatPersianDate,
} from "@/lib/persian";

interface TaxRecord {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerNationalId: string | null;
  totalAmount: number;
  taxableAmount: number;
  vatAmount: number;
  makingTaxAmount: number;
  totalTax: number;
  paymentMethod: string;
}

interface TaxSummary {
  period: { from: string; to: string };
  totalSales: number;
  totalAmount: number;
  totalVat: number;
  totalMakingTax: number;
  totalTax: number;
  exemptAmount: number;
}

export function TaxPanel() {
  const [data, setData] = React.useState<{
    summary: TaxSummary;
    records: TaxRecord[];
    vatRate: number;
    goldMakingTaxRate: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState("month");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tax?period=${period}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (error) {
      console.error("Tax load error:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ["شماره فاکتور", "تاریخ", "مشتری", "کد ملی", "مبلغ کل", "مالیات بر ارزش افزوده", "مالیات اجرت", "کل مالیات"];
    const rows = data.records.map((r) => [
      r.invoiceNumber,
      formatPersianDate(r.date),
      r.customerName,
      r.customerNationalId || "",
      r.totalAmount,
      r.vatAmount,
      r.makingTaxAmount,
      r.totalTax,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `گزارش-مالیاتی-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
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

  const { summary, records, vatRate, goldMakingTaxRate } = data;

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                مودیان مالیاتی و ارزش افزوده
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                گزارش مالیات بر ارزش افزوده طلا و جواهر
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">این ماه</SelectItem>
                  <SelectItem value="quarter">این فصل</SelectItem>
                  <SelectItem value="year">امسال</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">خروجی</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">چاپ</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tax rules info */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-medium">قوانین مالیاتی طلا و جواهر ایران:</p>
              <p>• مالیات بر ارزش افزوده طلا: {toPersianDigits(goldMakingTaxRate)}٪ روی اجرت ساخت (شامل دریافتی از مشتری)</p>
              <p>• مالیات بر ارزش افزوده جواهر و نقره: {toPersianDigits(vatRate)}٪ روی کل مبلغ</p>
              <p>• سکه طلا (۲۴ عیار/投资的): معاف از مالیات</p>
              <p>• پلاک طلا: معاف از مالیات</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <Badge variant="secondary">{toPersianDigits(summary.totalSales)} فاکتور</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">کل فروش دوره</p>
            <p className="text-base sm:text-lg font-bold tabular-nums ltr-num">
              {formatNumber(summary.totalAmount)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
                <Percent className="w-4 h-4 text-purple-600" />
              </div>
              <Badge variant="outline">مالیات ارزش افزوده</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">مالیات {toPersianDigits(vatRate)}٪</p>
            <p className="text-base sm:text-lg font-bold tabular-nums ltr-num">
              {formatNumber(summary.totalVat)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-green-600" />
              </div>
              <Badge variant="outline">مالیات اجرت</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">مالیات {toPersianDigits(goldMakingTaxRate)}٪ اجرت</p>
            <p className="text-base sm:text-lg font-bold tabular-nums ltr-num">
              {formatNumber(summary.totalMakingTax)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-red-600" />
              </div>
              <Badge variant="destructive">کل مالیات</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-1">پرداختنی به سازمان مالی</p>
            <p className="text-base sm:text-lg font-bold tabular-nums ltr-num text-red-600">
              {formatNumber(summary.totalTax)}
            </p>
            <p className="text-[10px] text-muted-foreground">تومان</p>
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            جزئیات فاکتورها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                  <tr className="text-right">
                    <th className="p-2 font-medium">شماره فاکتور</th>
                    <th className="p-2 font-medium hidden sm:table-cell">تاریخ</th>
                    <th className="p-2 font-medium">مشتری</th>
                    <th className="p-2 font-medium text-left">مبلغ کل</th>
                    <th className="p-2 font-medium text-left hidden md:table-cell">مالیات VA</th>
                    <th className="p-2 font-medium text-left hidden md:table-cell">مالیات اجرت</th>
                    <th className="p-2 font-medium text-left">کل مالیات</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-muted/50">
                      <td className="p-2 font-mono">{r.invoiceNumber}</td>
                      <td className="p-2 hidden sm:table-cell text-muted-foreground">
                        {formatPersianDate(r.date)}
                      </td>
                      <td className="p-2">{r.customerName}</td>
                      <td className="p-2 text-left tabular-nums ltr-num">
                        {formatNumber(r.totalAmount)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num hidden md:table-cell text-muted-foreground">
                        {formatNumber(r.vatAmount)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num hidden md:table-cell text-muted-foreground">
                        {formatNumber(r.makingTaxAmount)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num font-medium text-red-600">
                        {formatNumber(r.totalTax)}
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        فاکتوری در این دوره ثبت نشده است
                      </td>
                    </tr>
                  )}
                </tbody>
                {records.length > 0 && (
                  <tfoot className="bg-muted/50 sticky bottom-0">
                    <tr className="font-bold border-t-2">
                      <td className="p-2" colSpan={3}>جمع کل</td>
                      <td className="p-2 text-left tabular-nums ltr-num">
                        {formatNumber(summary.totalAmount)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num hidden md:table-cell">
                        {formatNumber(summary.totalVat)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num hidden md:table-cell">
                        {formatNumber(summary.totalMakingTax)}
                      </td>
                      <td className="p-2 text-left tabular-nums ltr-num text-red-600">
                        {formatNumber(summary.totalTax)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Period info */}
      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
        <Crown className="w-3 h-3" />
        <span>دوره گزارش: {formatPersianDate(summary.period.from)} تا {formatPersianDate(summary.period.to)}</span>
      </div>
    </div>
  );
}
