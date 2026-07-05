// Demo data for Vercel deployment (when database is not available)
// This provides sample data so the app works on Vercel without a database

export const DEMO_TENANT = {
  id: "demo-tenant",
  name: "طلا و جواهر زرین شهر",
  slug: "zarrin-shahr",
  plan: "enterprise",
  status: "active",
  settings: '{"currency":"toman","taxRate":0.09}',
};

export const DEMO_BRANCHES = [
  { id: "demo-branch", tenantId: "demo-tenant", name: "شعبه مرکزی - بازار طلا", code: "TEH-01", address: "تهران، بازار بزرگ طلا", phone: "021-55123456", isWarehouse: false, isMain: true, status: "active" },
  { id: "demo-branch-2", tenantId: "demo-tenant", name: "شعبه اصفهان - قیصریه", code: "ISF-01", address: "اصفهان، بازار قیصریه", phone: "031-55234567", isWarehouse: false, isMain: false, status: "active" },
  { id: "demo-branch-3", tenantId: "demo-tenant", name: "شعبه شیراز - وکیل", code: "SHZ-01", address: "شیراز، بازار وکیل", phone: "071-55345678", isWarehouse: false, isMain: false, status: "active" },
  { id: "demo-warehouse", tenantId: "demo-tenant", name: "انبار مرکزی", code: "WH-01", address: null, phone: null, isWarehouse: true, isMain: false, status: "active" },
];

export const DEMO_CATEGORIES = [
  { id: "cat-1", tenantId: "demo-tenant", name: "نشان عروسی", slug: "wedding-bands", parentId: null, description: null },
  { id: "cat-2", tenantId: "demo-tenant", name: "انگشتر", slug: "rings", parentId: null, description: null },
  { id: "cat-3", tenantId: "demo-tenant", name: "گردنبند", slug: "necklaces", parentId: null, description: null },
  { id: "cat-4", tenantId: "demo-tenant", name: "دستبند", slug: "bracelets", parentId: null, description: null },
  { id: "cat-5", tenantId: "demo-tenant", name: "نیم‌ست", slug: "sets", parentId: null, description: null },
  { id: "cat-6", tenantId: "demo-tenant", name: "تنگسیر", slug: "chains", parentId: null, description: null },
  { id: "cat-7", tenantId: "demo-tenant", name: "پلاک طلا", slug: "coins", parentId: null, description: null },
  { id: "cat-8", tenantId: "demo-tenant", name: "گوشواره", slug: "earrings", parentId: null, description: null },
];

export const DEMO_PRODUCTS = [
  { id: "prod-1", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-1", sku: "GH-0001", barcode: "6200001", name: "نشان عروسی ساده ۷۵۰", karat: "750", weight: 4.5, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 18000000, salePrice: 22500000, costPrice: 18000000, stock: 12, minStock: 3, status: "active", images: "[]", description: "نشان عروسی ساده ۷۵۰", category: { id: "cat-1", name: "نشان عروسی" } },
  { id: "prod-2", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-2", sku: "GH-0002", barcode: "6200002", name: "انگشتر مردانه سنگ نیم‌قیمت", karat: "750", weight: 8.2, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 32000000, salePrice: 41000000, costPrice: 32000000, stock: 5, minStock: 3, status: "active", images: "[]", description: "انگشتر مردانه", category: { id: "cat-2", name: "انگشتر" } },
  { id: "prod-3", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-3", sku: "GH-0003", barcode: "6200003", name: "گردنبند ژولیا", karat: "750", weight: 12.3, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 49000000, salePrice: 62000000, costPrice: 49000000, stock: 8, minStock: 3, status: "active", images: "[]", description: "گردنبند ژولیا", category: { id: "cat-3", name: "گردنبند" } },
  { id: "prod-4", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-4", sku: "GH-0004", barcode: "6200004", name: "دستبند فیلیگرین", karat: "916", weight: 15.8, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 72000000, salePrice: 89000000, costPrice: 72000000, stock: 3, minStock: 3, status: "active", images: "[]", description: "دستبند فیلیگرین", category: { id: "cat-4", name: "دستبند" } },
  { id: "prod-5", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-5", sku: "GH-0005", barcode: "6200005", name: "نیم‌ست الماس", karat: "750", weight: 22.5, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 145000000, salePrice: 185000000, costPrice: 145000000, stock: 2, minStock: 3, status: "active", images: "[]", description: "نیم‌ست الماس", category: { id: "cat-5", name: "نیم‌ست" } },
  { id: "prod-6", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-6", sku: "GH-0006", barcode: "6200006", name: "تنگسیر ظریف ۵۰", karat: "750", weight: 50, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 200000000, salePrice: 245000000, costPrice: 200000000, stock: 4, minStock: 3, status: "active", images: "[]", description: "تنگسیر ۵۰ گرم", category: { id: "cat-6", name: "تنگسیر" } },
  { id: "prod-7", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-7", sku: "GH-0007", barcode: "6200007", name: "پلاک امیرالمومنین", karat: "999", weight: 8.13, makingCharge: 0, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 33000000, salePrice: 35500000, costPrice: 33000000, stock: 50, minStock: 3, status: "active", images: "[]", description: "پلاک امیرالمومنین", category: { id: "cat-7", name: "پلاک طلا" } },
  { id: "prod-8", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-2", sku: "GH-0008", barcode: "6200008", name: "انگشتر زنانه نگین دار", karat: "750", weight: 5.8, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 23000000, salePrice: 29500000, costPrice: 23000000, stock: 9, minStock: 3, status: "active", images: "[]", description: "انگشتر زنانه", category: { id: "cat-2", name: "انگشتر" } },
  { id: "prod-9", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-3", sku: "GH-0009", barcode: "6200009", name: "گردنبند قلب", karat: "585", weight: 6.4, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 18000000, salePrice: 23500000, costPrice: 18000000, stock: 15, minStock: 3, status: "active", images: "[]", description: "گردنبند قلب", category: { id: "cat-3", name: "گردنبند" } },
  { id: "prod-10", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-8", sku: "GH-0010", barcode: "6200010", name: "گوشواره حلقه‌ای", karat: "750", weight: 4.5, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 18000000, salePrice: 23000000, costPrice: 18000000, stock: 14, minStock: 3, status: "active", images: "[]", description: "گوشواره حلقه‌ای", category: { id: "cat-8", name: "گوشواره" } },
  { id: "prod-11", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-1", sku: "GH-0011", barcode: "6200011", name: "نشان عروسی دو رنگ", karat: "750", weight: 5.8, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 23500000, salePrice: 29500000, costPrice: 23500000, stock: 1, minStock: 3, status: "active", images: "[]", description: "نشان دو رنگ", category: { id: "cat-1", name: "نشان عروسی" } },
  { id: "prod-12", tenantId: "demo-tenant", branchId: "demo-branch", categoryId: "cat-6", sku: "GH-0012", barcode: "6200012", name: "تنگسیر مردانه ۸۰", karat: "750", weight: 80, makingCharge: 150000, makingType: "per_gram", stoneWeight: 0, stoneCost: 0, purchasePrice: 320000000, salePrice: 390000000, costPrice: 320000000, stock: 2, minStock: 3, status: "active", images: "[]", description: "تنگسیر ۸۰ گرم", category: { id: "cat-6", name: "تنگسیر" } },
];

export const DEMO_CUSTOMERS = [
  { id: "cust-1", tenantId: "demo-tenant", name: "زهرا حسینی", phone: "09121234567", email: null, address: null, birthday: new Date(1990, 5, 15), nationalId: null, loyaltyPoints: 1250, totalSpent: 89000000, totalOrders: 9, notes: null, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  { id: "cust-2", tenantId: "demo-tenant", name: "محمد رضایی", phone: "09127654321", email: null, address: null, birthday: new Date(1985, 8, 22), nationalId: null, loyaltyPoints: 850, totalSpent: 62000000, totalOrders: 7, notes: null, createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
  { id: "cust-3", tenantId: "demo-tenant", name: "مریم کریمی", phone: "09131112233", email: null, address: null, birthday: new Date(1995, 2, 10), nationalId: null, loyaltyPoints: 2100, totalSpent: 145000000, totalOrders: 15, notes: null, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
  { id: "cust-4", tenantId: "demo-tenant", name: "حسین موسوی", phone: "09144445566", email: null, address: null, birthday: new Date(1988, 11, 5), nationalId: null, loyaltyPoints: 320, totalSpent: 25000000, totalOrders: 3, notes: null, createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
  { id: "cust-5", tenantId: "demo-tenant", name: "فاطمه نوری", phone: "09157778899", email: null, address: null, birthday: new Date(1992, 6, 28), nationalId: null, loyaltyPoints: 1800, totalSpent: 120000000, totalOrders: 12, notes: null, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
];

export const DEMO_GOLD_PRICES = [
  { id: "gp-1", tenantId: "demo-tenant", karat: "999", pricePerGram: 3200000, currency: "IRR", source: "live", createdAt: new Date() },
  { id: "gp-2", tenantId: "demo-tenant", karat: "916", pricePerGram: 2950000, currency: "IRR", source: "live", createdAt: new Date() },
  { id: "gp-3", tenantId: "demo-tenant", karat: "750", pricePerGram: 2450000, currency: "IRR", source: "live", createdAt: new Date() },
  { id: "gp-4", tenantId: "demo-tenant", karat: "585", pricePerGram: 1950000, currency: "IRR", source: "live", createdAt: new Date() },
];

export const DEMO_ALERTS = [
  { id: "alert-1", tenantId: "demo-tenant", type: "low_stock", severity: "warning", title: "موجودی کم", message: "محصول «نشان عروسی دو رنگ» رو به اتمام است (۱ عدد باقی مانده)", read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: "alert-2", tenantId: "demo-tenant", type: "price_change", severity: "info", title: "صعود قیمت طلا", message: "قیمت طلا در ۲۴ ساعت گذشته ۲.۳٪ افزایش یافته است", read: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: "alert-3", tenantId: "demo-tenant", type: "order_deadline", severity: "warning", title: "مهلت تحویل نزدیک", message: "۳ سفارش سفارشی تا ۳ روز آینده باید تحویل داده شوند", read: false, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) },
];

// Generate demo sales
function generateDemoSales() {
  const sales: any[] = [];
  let invoiceCounter = 5000;
  const cashiers = ["demo-admin", "demo-cashier"];
  for (let day = 29; day >= 0; day--) {
    const salesPerDay = Math.floor(Math.random() * 4) + 1;
    for (let s = 0; s < salesPerDay; s++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(Math.floor(Math.random() * 11) + 9, Math.floor(Math.random() * 60));
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items: any[] = [];
      for (let it = 0; it < numItems; it++) {
        const prod = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
        const total = prod.salePrice;
        subtotal += total;
        items.push({
          id: `si-${invoiceCounter}-${it}`,
          saleId: `sale-${invoiceCounter}`,
          productId: prod.id,
          name: prod.name,
          karat: prod.karat,
          weight: prod.weight,
          makingCharge: prod.makingCharge,
          unitPrice: prod.salePrice,
          quantity: 1,
          total,
        });
      }
      const discount = Math.random() > 0.75 ? Math.floor(subtotal * 0.05) : 0;
      const total = subtotal - discount;
      invoiceCounter++;
      const customer = Math.random() > 0.3 ? DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)] : null;
      sales.push({
        id: `sale-${invoiceCounter}`,
        tenantId: "demo-tenant",
        branchId: "demo-branch",
        invoiceNumber: `INV-${invoiceCounter}`,
        customerId: customer?.id || null,
        cashierId: cashiers[Math.floor(Math.random() * cashiers.length)],
        subtotal,
        discount,
        tax: 0,
        makingTotal: 0,
        total,
        paymentMethod: ["cash", "card", "transfer"][Math.floor(Math.random() * 3)],
        paymentStatus: "paid",
        status: "completed",
        notes: null,
        createdAt: date,
        customer: customer ? { name: customer.name } : null,
        cashier: { name: "حجت جوشنی" },
        items,
      });
    }
  }
  return sales;
}

export const DEMO_SALES = generateDemoSales();

export const DEMO_ORDERS = [
  { id: "ord-1", tenantId: "demo-tenant", orderNumber: "ORD-5001", customerId: "cust-1", type: "custom", title: "انگشتر نام سفارشی با نگین الماس", description: "سفارش ساخت انگشتر", status: "manufacturing", goldWeight: 8.5, karat: "750", makingCharge: 2500000, stoneCost: 15000000, estimatedCost: 38000000, finalCost: 0, assignedToId: "demo-staff", deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), customer: { name: "زهرا حسینی" }, assignedTo: { name: "استاد کریم زرگر" }, items: [], timeline: [{ status: "pending", note: "سفارش ثبت شد", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, { status: "design", note: "طراحی اولیه انجام شد", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, { status: "manufacturing", note: "مرحله ساخت آغاز شد", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }] },
  { id: "ord-2", tenantId: "demo-tenant", orderNumber: "ORD-5002", customerId: "cust-2", type: "repair", title: "تعمیر گیره گردنبند", description: "تعمیر گردنبند", status: "ready", goldWeight: 0, karat: "750", makingCharge: 500000, stoneCost: 0, estimatedCost: 500000, finalCost: 0, assignedToId: "demo-staff", deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), customer: { name: "محمد رضایی" }, assignedTo: { name: "استاد کریم زرگر" }, items: [], timeline: [{ status: "pending", note: "تعمیر ثبت شد", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }, { status: "polishing", note: "تعمیر انجام شد", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }, { status: "ready", note: "آماده تحویل", createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }] },
  { id: "ord-3", tenantId: "demo-tenant", orderNumber: "ORD-5003", customerId: "cust-3", type: "manufacturing", title: "نیم‌ست عروسی طراحی اختصاصی", description: "ساخت نیم‌ست", status: "delivered", goldWeight: 25, karat: "750", makingCharge: 5000000, stoneCost: 30000000, estimatedCost: 95000000, finalCost: 98000000, assignedToId: "demo-staff", deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), customer: { name: "مریم کریمی" }, assignedTo: { name: "استاد کریم زرگر" }, items: [], timeline: [{ status: "pending", note: "ثبت شد", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }, { status: "design", note: "طراحی", createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) }, { status: "manufacturing", note: "ساخت", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }, { status: "polishing", note: "پرداخت", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, { status: "ready", note: "آماده", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, { status: "delivered", note: "تحویل", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }] },
];

export const DEMO_EXPENSES = [
  { id: "exp-1", tenantId: "demo-tenant", branchId: "demo-branch", category: "rent", description: "اجاره شعبه مرکزی", amount: 35000000, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: "exp-2", tenantId: "demo-tenant", branchId: "demo-branch", category: "salary", description: "حقوق کارکنان", amount: 120000000, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: "exp-3", tenantId: "demo-tenant", branchId: "demo-branch", category: "utilities", description: "قبض برق و آب", amount: 4200000, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: "exp-4", tenantId: "demo-tenant", branchId: "demo-branch", category: "supplies", description: "خرید مواد اولیه", amount: 850000000, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "exp-5", tenantId: "demo-tenant", branchId: "demo-branch", category: "marketing", description: "تبلیغات اینستاگرام", amount: 15000000, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
];

export const DEMO_USERS = [
  { id: "demo-admin", tenantId: "demo-tenant", email: "admin@goldhub.ir", phone: "09121234567", name: "حجت جوشنی", role: "super_admin", status: "active", avatar: null, branchId: "demo-branch", lastLoginAt: new Date(), branch: { name: "شعبه مرکزی - بازار طلا" } },
  { id: "demo-cashier", tenantId: "demo-tenant", email: "cashier@goldhub.ir", phone: "09127654321", name: "علی محمدی", role: "cashier", status: "active", avatar: null, branchId: "demo-branch", lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), branch: { name: "شعبه مرکزی - بازار طلا" } },
  { id: "demo-manager", tenantId: "demo-tenant", email: "manager@goldhub.ir", phone: "09131112233", name: "فاطمه احمدی", role: "manager", status: "active", avatar: null, branchId: "demo-branch-2", lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), branch: { name: "شعبه اصفهان - قیصریه" } },
  { id: "demo-staff", tenantId: "demo-tenant", email: "reza@goldhub.ir", phone: "09144445566", name: "رضا حسینی", role: "staff", status: "active", avatar: null, branchId: "demo-branch-3", lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), branch: { name: "شعبه شیراز - وکیل" } },
];

export const DEMO_AUDIT_LOGS = [
  { id: "log-1", tenantId: "demo-tenant", userId: "demo-admin", action: "login", entity: "User", entityId: "demo-admin", details: '{"email":"admin@goldhub.ir"}', ip: "192.168.1.100", createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), user: { name: "حجت جوشنی", role: "super_admin" } },
  { id: "log-2", tenantId: "demo-tenant", userId: "demo-admin", action: "create", entity: "Product", entityId: "prod-1", details: '{"name":"نشان عروسی"}', ip: "192.168.1.100", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), user: { name: "حجت جوشنی", role: "super_admin" } },
  { id: "log-3", tenantId: "demo-tenant", userId: "demo-cashier", action: "create", entity: "Sale", entityId: "sale-1", details: '{"invoice":"INV-5001"}', ip: "192.168.1.101", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), user: { name: "علی محمدی", role: "cashier" } },
  { id: "log-4", tenantId: "demo-tenant", userId: "demo-admin", action: "update", entity: "GoldPrice", details: '{"karat":"750"}', ip: "192.168.1.100", createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), user: { name: "حجت جوشنی", role: "super_admin" } },
  { id: "log-5", tenantId: "demo-tenant", userId: "demo-manager", action: "create", entity: "Customer", details: '{"name":"زهرا حسینی"}', ip: "192.168.1.102", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), user: { name: "فاطمه احمدی", role: "manager" } },
];

export const DEMO_CASHBOXES = [
  { id: "cb-1", tenantId: "demo-tenant", branchId: "demo-branch", name: "صندوق اصلی", balance: 45800000, openingBalance: 5000000, closingBalance: 0, status: "open", openedAt: new Date(new Date().setHours(8, 0, 0, 0)), closedAt: null, transactions: [] },
  { id: "cb-2", tenantId: "demo-tenant", branchId: "demo-branch-2", name: "صندوق اصفهان", balance: 32500000, openingBalance: 4000000, closingBalance: 0, status: "open", openedAt: new Date(new Date().setHours(8, 0, 0, 0)), closedAt: null, transactions: [] },
];

/**
 * Check if we should use demo data (when database is not available)
 */
export function shouldUseDemoData(tenantId: string): boolean {
  return tenantId === "demo-tenant" || tenantId.startsWith("demo-");
}
