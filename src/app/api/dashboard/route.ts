import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import {
  DEMO_PRODUCTS,
  DEMO_CUSTOMERS,
  DEMO_SALES,
  DEMO_GOLD_PRICES,
  DEMO_ALERTS,
  DEMO_EXPENSES,
} from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "احراز هویت نشده" }, { status: 401 });
    }

    // Check if database is available
    const dbOk = await isDbAvailable();
    if (!dbOk) {
      return NextResponse.json(getDemoDashboard());
    }

    try {
      const tenantId = user.tenantId;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Total sales (30 days)
      const sales = await db.sale.findMany({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
          status: "completed",
        },
        select: {
          total: true,
          createdAt: true,
          paymentMethod: true,
          branchId: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const totalSales30 = sales.reduce((sum, s) => sum + s.total, 0);
      const todaySales = sales
        .filter((s) => s.createdAt >= todayStart)
        .reduce((sum, s) => sum + s.total, 0);
      const salesCount = sales.length;

      const prevPeriodStart = new Date(
        thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const prevSales = await db.sale.aggregate({
        where: {
          tenantId,
          createdAt: { gte: prevPeriodStart, lt: thirtyDaysAgo },
          status: "completed",
        },
        _sum: { total: true },
      });
      const salesGrowth =
        prevSales._sum.total && prevSales._sum.total > 0
          ? ((totalSales30 - prevSales._sum.total) / prevSales._sum.total) * 100
          : 0;

      // Sales by day (last 14 days)
      const dailySales: { date: string; total: number; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const daySales = sales.filter(
          (s) => s.createdAt >= dayStart && s.createdAt < dayEnd
        );
        dailySales.push({
          date: dayStart.toISOString(),
          total: daySales.reduce((sum, s) => sum + s.total, 0),
          count: daySales.length,
        });
      }

      // Inventory stats
      const products = await db.product.findMany({
        where: { tenantId },
        select: {
          id: true,
          salePrice: true,
          purchasePrice: true,
          stock: true,
          weight: true,
          karat: true,
          name: true,
          minStock: true,
        },
      });

      const inventoryValue = products.reduce(
        (sum, p) => sum + p.purchasePrice * p.stock,
        0
      );
      const inventoryRetailValue = products.reduce(
        (sum, p) => sum + p.salePrice * p.stock,
        0
      );
      const totalGoldWeight = products.reduce(
        (sum, p) => sum + p.weight * p.stock,
        0
      );
      const lowStockProducts = products.filter(
        (p) => p.stock <= p.minStock && p.stock > 0
      );
      const outOfStockProducts = products.filter((p) => p.stock === 0);

      const karatDist: Record<string, { count: number; weight: number }> = {};
      for (const p of products) {
        if (!karatDist[p.karat]) karatDist[p.karat] = { count: 0, weight: 0 };
        karatDist[p.karat].count += p.stock;
        karatDist[p.karat].weight += p.weight * p.stock;
      }

      const customersCount = await db.customer.count({ where: { tenantId } });
      const newCustomers = await db.customer.count({
        where: { tenantId, createdAt: { gte: sevenDaysAgo } },
      });

      const expenses = await db.expense.aggregate({
        where: { tenantId, date: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      });

      const netProfit = totalSales30 - (expenses._sum.amount || 0);

      const goldPrices = await db.goldPrice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const alerts = await db.alert.findMany({
        where: { tenantId, read: false },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const paymentMethods: Record<string, number> = {};
      for (const s of sales) {
        paymentMethods[s.paymentMethod] =
          (paymentMethods[s.paymentMethod] || 0) + s.total;
      }

      const topProductSales = await db.saleItem.groupBy({
        by: ["productId", "name"],
        where: {
          sale: { tenantId, createdAt: { gte: thirtyDaysAgo } },
        },
        _sum: { total: true, quantity: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      });

      const recentSales = await db.sale.findMany({
        where: { tenantId },
        include: {
          customer: { select: { name: true } },
          cashier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      });

      return NextResponse.json({
        kpis: {
          totalSales: totalSales30,
          todaySales,
          salesCount,
          salesGrowth: Math.round(salesGrowth * 10) / 10,
          inventoryValue,
          inventoryRetailValue,
          totalGoldWeight,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          customersCount,
          newCustomers,
          expenses: expenses._sum.amount || 0,
          netProfit,
          profitMargin:
            totalSales30 > 0
              ? Math.round((netProfit / totalSales30) * 1000) / 10
              : 0,
        },
        charts: {
          dailySales,
          karatDistribution: Object.entries(karatDist).map(([k, v]) => ({
            karat: k,
            ...v,
          })),
          paymentMethods: Object.entries(paymentMethods).map(
            ([method, amount]) => ({ method, amount })
          ),
          topProducts: topProductSales.map((p) => ({
            name: p.name,
            revenue: p._sum.total,
            quantity: p._sum.quantity,
          })),
        },
        goldPrices: goldPrices.map((g) => ({
          karat: g.karat,
          price: g.pricePerGram,
          updatedAt: g.createdAt,
        })),
        alerts,
        recentSales: recentSales.map((s) => ({
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          total: s.total,
          paymentMethod: s.paymentMethod,
          status: s.status,
          customer: s.customer?.name || "مشتری متفرقه",
          cashier: s.cashier.name,
          createdAt: s.createdAt,
        })),
        lowStockProducts: lowStockProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          minStock: p.minStock,
          karat: p.karat,
        })),
      });
    } catch (dbError) {
      console.error("Dashboard DB error, using demo:", dbError);
      return NextResponse.json(getDemoDashboard());
    }
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت داده‌های داشبورد" },
      { status: 500 }
    );
  }
}

/**
 * Demo dashboard data for when database is not available (Vercel)
 */
function getDemoDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const sales = DEMO_SALES.filter((s) => s.createdAt >= thirtyDaysAgo);
  const totalSales30 = sales.reduce((sum, s) => sum + s.total, 0);
  const todaySales = sales
    .filter((s) => s.createdAt >= todayStart)
    .reduce((sum, s) => sum + s.total, 0);

  // Daily sales (14 days)
  const dailySales: { date: string; total: number; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySales = sales.filter(
      (s) => s.createdAt >= dayStart && s.createdAt < dayEnd
    );
    dailySales.push({
      date: dayStart.toISOString(),
      total: daySales.reduce((sum, s) => sum + s.total, 0),
      count: daySales.length,
    });
  }

  const inventoryValue = DEMO_PRODUCTS.reduce(
    (sum, p) => sum + p.purchasePrice * p.stock,
    0
  );
  const totalGoldWeight = DEMO_PRODUCTS.reduce(
    (sum, p) => sum + p.weight * p.stock,
    0
  );
  const lowStockProducts = DEMO_PRODUCTS.filter(
    (p) => p.stock <= p.minStock && p.stock > 0
  );

  const karatDist: Record<string, { count: number; weight: number }> = {};
  for (const p of DEMO_PRODUCTS) {
    if (!karatDist[p.karat]) karatDist[p.karat] = { count: 0, weight: 0 };
    karatDist[p.karat].count += p.stock;
    karatDist[p.karat].weight += p.weight * p.stock;
  }

  const paymentMethods: Record<string, number> = {};
  for (const s of sales) {
    paymentMethods[s.paymentMethod] =
      (paymentMethods[s.paymentMethod] || 0) + s.total;
  }

  const totalExpenses = DEMO_EXPENSES_VALUE;
  const netProfit = totalSales30 - totalExpenses;

  // Top products
  const productSales: Record<string, { name: string; revenue: number; quantity: number }> = {};
  for (const s of sales) {
    for (const item of s.items) {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, revenue: 0, quantity: 0 };
      }
      productSales[item.productId].revenue += item.total;
      productSales[item.productId].quantity += item.quantity;
    }
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const recentSales = sales
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 8);

  return {
    kpis: {
      totalSales: totalSales30,
      todaySales,
      salesCount: sales.length,
      salesGrowth: 12.5,
      inventoryValue,
      inventoryRetailValue: DEMO_PRODUCTS.reduce(
        (sum, p) => sum + p.salePrice * p.stock,
        0
      ),
      totalGoldWeight,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: 0,
      customersCount: DEMO_CUSTOMERS.length,
      newCustomers: 2,
      expenses: totalExpenses,
      netProfit,
      profitMargin: totalSales30 > 0 ? Math.round((netProfit / totalSales30) * 1000) / 10 : 0,
    },
    charts: {
      dailySales,
      karatDistribution: Object.entries(karatDist).map(([k, v]) => ({
        karat: k,
        ...v,
      })),
      paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
        method,
        amount,
      })),
      topProducts,
    },
    goldPrices: DEMO_GOLD_PRICES.map((g) => ({
      karat: g.karat,
      price: g.pricePerGram,
      updatedAt: g.createdAt,
    })),
    alerts: DEMO_ALERTS,
    recentSales: recentSales.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      total: s.total,
      paymentMethod: s.paymentMethod,
      status: s.status,
      customer: s.customer?.name || "مشتری متفرقه",
      cashier: s.cashier.name,
      createdAt: s.createdAt,
    })),
    lowStockProducts: lowStockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
      karat: p.karat,
    })),
  };
}

const DEMO_EXPENSES_VALUE = DEMO_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
