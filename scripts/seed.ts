import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🌱 شروع seed کامل گلد هاب...");

  // پاک کردن داده‌های قبلی
  console.log("🧹 پاک کردن داده‌های قبلی...");
  await db.aIQuery.deleteMany();
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.alert.deleteMany();
  await db.goldPrice.deleteMany();
  await db.cashboxTransaction.deleteMany();
  await db.cashbox.deleteMany();
  await db.expense.deleteMany();
  await db.invoice.deleteMany();
  await db.orderTimeline.deleteMany();
  await db.customOrderItem.deleteMany();
  await db.customOrder.deleteMany();
  await db.saleItem.deleteMany();
  await db.sale.deleteMany();
  await db.stockMovement.deleteMany();
  await db.transfer.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.supplier.deleteMany();
  await db.customer.deleteMany();
  await db.user.deleteMany();
  await db.branch.deleteMany();
  await db.tenant.deleteMany();
  console.log("✓ داده‌های قبلی پاک شد");

  // ایجاد tenant
  const tenant = await db.tenant.create({
    data: {
      name: "طلا و جواهر زرین شهر",
      slug: "zarrin-shahr",
      plan: "enterprise",
      status: "active",
      settings: JSON.stringify({
        currency: "toman",
        taxRate: 0.09,
        goldPriceAuto: false,
        invoicePrefix: "INV",
        companyName: "طلا و جواهر زرین شهر",
        companyPhone: "021-55123456",
        companyAddress: "تهران، بازار بزرگ طلا، راسته زرگرها، پلاک ۱۲",
      }),
    },
  });
  console.log("✓ tenant ایجاد شد:", tenant.name);

  // شعبات
  const mainBranch = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: "شعبه مرکزی - بازار طلا",
      code: "TEH-01",
      address: "تهران، بازار بزرگ طلا، راسته زرگرها",
      phone: "021-55123456",
      isMain: true,
      status: "active",
    },
  });
  const branch2 = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: "شعبه اصفهان - قیصریه",
      code: "ISF-01",
      address: "اصفهان، بازار قیصریه، راسته طلا",
      phone: "031-55234567",
      status: "active",
    },
  });
  const branch3 = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: "شعبه شیراز - وکیل",
      code: "SHZ-01",
      address: "شیراز، بازار وکیل، راسته زرگرها",
      phone: "071-55345678",
      status: "active",
    },
  });
  const warehouse = await db.branch.create({
    data: {
      tenantId: tenant.id,
      name: "انبار مرکزی",
      code: "WH-01",
      isWarehouse: true,
      status: "active",
    },
  });
  console.log("✓ ۴ شعبه/انبار ایجاد شد");

  // کاربران
  const adminPass = await hashPassword("admin123");
  const staffPass = await hashPassword("staff123");

  const admin = await db.user.create({
    data: {
      email: "admin@goldhub.ir",
      passwordHash: adminPass,
      name: "حجت جوشنی",
      role: "super_admin",
      status: "active",
      tenantId: tenant.id,
      branchId: mainBranch.id,
      lastLoginAt: new Date(),
    },
  });
  const cashier1 = await db.user.create({
    data: {
      email: "cashier@goldhub.ir",
      passwordHash: staffPass,
      name: "علی محمدی",
      role: "cashier",
      tenantId: tenant.id,
      branchId: mainBranch.id,
    },
  });
  const cashier2 = await db.user.create({
    data: {
      email: "sara@goldhub.ir",
      passwordHash: staffPass,
      name: "سارا کریمی",
      role: "cashier",
      tenantId: tenant.id,
      branchId: mainBranch.id,
    },
  });
  const manager1 = await db.user.create({
    data: {
      email: "manager@goldhub.ir",
      passwordHash: staffPass,
      name: "فاطمه احمدی",
      role: "manager",
      tenantId: tenant.id,
      branchId: branch2.id,
    },
  });
  const staff1 = await db.user.create({
    data: {
      email: "reza@goldhub.ir",
      passwordHash: staffPass,
      name: "رضا حسینی",
      role: "staff",
      tenantId: tenant.id,
      branchId: branch3.id,
    },
  });
  const goldsmith = await db.user.create({
    data: {
      email: "goldsmith@goldhub.ir",
      passwordHash: staffPass,
      name: "استاد کریم زرگر",
      role: "staff",
      tenantId: tenant.id,
      branchId: warehouse.id,
    },
  });
  console.log("✓ ۶ کاربر ایجاد شد");
  console.log("  📧 مدیر: admin@goldhub.ir / admin123");

  // دسته‌بندی‌ها
  const categoriesData = [
    { name: "نشان عروسی", slug: "wedding-bands", parent: null },
    { name: "انگشتر", slug: "rings", parent: null },
    { name: "انگشتر مردانه", slug: "mens-rings", parent: "rings" },
    { name: "انگشتر زنانه", slug: "womens-rings", parent: "rings" },
    { name: "گردنبند", slug: "necklaces", parent: null },
    { name: "دستبند", slug: "bracelets", parent: null },
    { name: "نیم‌ست", slug: "sets", parent: null },
    { name: "تنگسیر", slug: "chains", parent: null },
    { name: "پلاک طلا", slug: "coins", parent: null },
    { name: "بچگی", slug: "kids", parent: null },
    { name: "گوشواره", slug: "earrings", parent: null },
    { name: "زنجیر", slug: "necklace-chains", parent: null },
    { name: "پایه عروس", slug: "bridal", parent: null },
    { name: "ساعت طلا", slug: "gold-watches", parent: null },
  ];
  const categoryMap: Record<string, string> = {};
  const slugToId: Record<string, string> = {};
  for (const c of categoriesData) {
    const parentId = c.parent ? slugToId[c.parent] : null;
    const cat = await db.category.create({
      data: { tenantId: tenant.id, name: c.name, slug: c.slug, parentId },
    });
    categoryMap[c.name] = cat.id;
    slugToId[c.slug] = cat.id;
  }
  console.log("✓ ۱۴ دسته‌بندی ایجاد شد");

  // تامین‌کنندگان
  const suppliers = [
    { name: "زرگری سنتی تهران", phone: "021-55667788", contact: "حاج آقا رضایی" },
    { name: "شرکت پالایش طلای ایرانیان", phone: "021-22334455", contact: "مهندس صادقی" },
    { name: "وارداتنده سنگ‌های قیمتی", phone: "021-88990011", contact: "آقای نوری" },
    { name: "کارگاه ساخت جواهر الماس", phone: "031-66778899", contact: "استاد شریفی" },
  ];
  for (const s of suppliers) {
    await db.supplier.create({
      data: { tenantId: tenant.id, name: s.name, phone: s.phone, contact: s.contact },
    });
  }
  console.log("✓ ۴ تامین‌کننده ایجاد شد");

  // محصولات (۵۰ محصول)
  const productsRaw = [
    // نشان عروسی
    { name: "نشان عروسی ساده ۷۵۰", cat: "wedding-bands", karat: "750", weight: 4.5, purchase: 18000000, sale: 22500000, stock: 12 },
    { name: "نشان عروسی خط‌دار", cat: "wedding-bands", karat: "750", weight: 5.2, purchase: 21000000, sale: 26500000, stock: 8 },
    { name: "نشان عروسی دو رنگ", cat: "wedding-bands", karat: "750", weight: 5.8, purchase: 23500000, sale: 29500000, stock: 1 },
    { name: "نشان عروسی ظریف", cat: "wedding-bands", karat: "750", weight: 3.2, purchase: 13000000, sale: 16500000, stock: 15 },
    { name: "نشان عروسی سنگ‌دار", cat: "wedding-bands", karat: "750", weight: 6.5, purchase: 32000000, sale: 41000000, stock: 4 },
    { name: "نشان عروسی ۹۱۶", cat: "wedding-bands", karat: "916", weight: 5.0, purchase: 24000000, sale: 29500000, stock: 6 },
    // انگشتر مردانه
    { name: "انگشتر مردانه سنگ نیم‌قیمت", cat: "mens-rings", karat: "750", weight: 8.2, purchase: 32000000, sale: 41000000, stock: 5 },
    { name: "انگشتر مردانه عقیق", cat: "mens-rings", karat: "750", weight: 9.5, purchase: 38000000, sale: 48500000, stock: 3 },
    { name: "انگشتر مردانه فیروزه", cat: "mens-rings", karat: "750", weight: 7.8, purchase: 35000000, sale: 44500000, stock: 7 },
    { name: "انگشتر مردانه ساده", cat: "mens-rings", karat: "750", weight: 6.5, purchase: 26000000, sale: 33500000, stock: 10 },
    { name: "انگشتر مردانه حلقه ضخیم", cat: "mens-rings", karat: "585", weight: 11.2, purchase: 32000000, sale: 41000000, stock: 2 },
    // انگشتر زنانه
    { name: "انگشتر زنانه نگین دار", cat: "womens-rings", karat: "750", weight: 5.8, purchase: 23000000, sale: 29500000, stock: 9 },
    { name: "انگشتر زنانه الماس ریز", cat: "womens-rings", karat: "750", weight: 4.2, purchase: 45000000, sale: 58000000, stock: 4 },
    { name: "انگشتر زنانه گل دار", cat: "womens-rings", karat: "750", weight: 4.8, purchase: 19500000, sale: 25000000, stock: 11 },
    { name: "انگشتر زنانه بیضی", cat: "womens-rings", karat: "750", weight: 5.3, purchase: 21500000, sale: 27500000, stock: 8 },
    { name: "انگشتر زنانه قلب", cat: "womens-rings", karat: "585", weight: 3.8, purchase: 12000000, sale: 15500000, stock: 14 },
    // گردنبند
    { name: "گردنبند ژولیا", cat: "necklaces", karat: "750", weight: 12.3, purchase: 49000000, sale: 62000000, stock: 8 },
    { name: "گردنبند قلب", cat: "necklaces", karat: "585", weight: 6.4, purchase: 18000000, sale: 23500000, stock: 15 },
    { name: "گردنبند ستاره", cat: "necklaces", karat: "750", weight: 7.8, purchase: 31000000, sale: 39500000, stock: 6 },
    { name: "گردنبند ماه تولد", cat: "necklaces", karat: "750", weight: 5.5, purchase: 22000000, sale: 28500000, stock: 12 },
    { name: "گردنبند الماس ریز", cat: "necklaces", karat: "750", weight: 9.2, purchase: 72000000, sale: 92000000, stock: 2 },
    { name: "گردنبند ظریف نقره طلایی", cat: "necklaces", karat: "750", weight: 3.8, purchase: 15000000, sale: 19500000, stock: 18 },
    // دستبند
    { name: "دستبند فیلیگرین", cat: "bracelets", karat: "916", weight: 15.8, purchase: 72000000, sale: 89000000, stock: 3 },
    { name: "دستبند اسلیو", cat: "bracelets", karat: "750", weight: 9.8, purchase: 39000000, sale: 49000000, stock: 6 },
    { name: "دستبند شنج", cat: "bracelets", karat: "750", weight: 18.5, purchase: 82000000, sale: 102000000, stock: 4 },
    { name: "دستبند نگین دار", cat: "bracelets", karat: "750", weight: 12.2, purchase: 56000000, sale: 71000000, stock: 5 },
    { name: "دستبند ظریف زنانه", cat: "bracelets", karat: "585", weight: 6.8, purchase: 21000000, sale: 27000000, stock: 9 },
    // نیم‌ست
    { name: "نیم‌ست الماس", cat: "sets", karat: "750", weight: 22.5, purchase: 145000000, sale: 185000000, stock: 2 },
    { name: "نیم‌ست نگین فیروزه", cat: "sets", karat: "750", weight: 18.8, purchase: 98000000, sale: 125000000, stock: 3 },
    { name: "نیم‌ست ظریف", cat: "sets", karat: "750", weight: 12.5, purchase: 58000000, sale: 74000000, stock: 5 },
    { name: "نیم‌ست عروسی", cat: "sets", karat: "750", weight: 28.2, purchase: 168000000, sale: 215000000, stock: 1 },
    // تنگسیر
    { name: "تنگسیر ظریف ۵۰", cat: "chains", karat: "750", weight: 50, purchase: 200000000, sale: 245000000, stock: 4 },
    { name: "تنگسیر مردانه ۸۰", cat: "chains", karat: "750", weight: 80, purchase: 320000000, sale: 390000000, stock: 2 },
    { name: "تنگسیر زنانه ۳۰", cat: "chains", karat: "750", weight: 30, purchase: 120000000, sale: 148000000, stock: 5 },
    { name: "تنگسیر باف ایرانی ۶۰", cat: "chains", karat: "750", weight: 60, purchase: 240000000, sale: 295000000, stock: 3 },
    { name: "تنگسیر ریز ۲۰", cat: "chains", karat: "750", weight: 20, purchase: 80000000, sale: 99000000, stock: 7 },
    // پلاک طلا
    { name: "پلاک امیرالمومنین", cat: "coins", karat: "999", weight: 8.13, purchase: 33000000, sale: 35500000, stock: 50 },
    { name: "پلاک نیم سکه", cat: "coins", karat: "999", weight: 4.06, purchase: 16500000, sale: 17800000, stock: 80 },
    { name: "پلاک ربع سکه", cat: "coins", karat: "999", weight: 2.03, purchase: 8500000, sale: 9200000, stock: 120 },
    { name: "سکه تمام بهار آزادی", cat: "coins", karat: "900", weight: 8.13, purchase: 31000000, sale: 33500000, stock: 35 },
    // بچگی
    { name: "بچگی پروانه", cat: "kids", karat: "585", weight: 3.2, purchase: 9000000, sale: 12500000, stock: 20 },
    { name: "بچگی ستاره", cat: "kids", karat: "585", weight: 2.8, purchase: 8000000, sale: 11000000, stock: 25 },
    { name: "بچگی قلب کوچک", cat: "kids", karat: "585", weight: 2.2, purchase: 6500000, sale: 9000000, stock: 30 },
    // گوشواره
    { name: "گوشواره حلقه ای", cat: "earrings", karat: "750", weight: 4.5, purchase: 18000000, sale: 23000000, stock: 14 },
    { name: "گوشواره نگین دار", cat: "earrings", karat: "750", weight: 6.2, purchase: 31000000, sale: 39500000, stock: 8 },
    { name: "گوشواره قطره‌ای", cat: "earrings", karat: "750", weight: 5.0, purchase: 24000000, sale: 31000000, stock: 10 },
    { name: "گوشواره ظریف", cat: "earrings", karat: "585", weight: 2.8, purchase: 9000000, sale: 12000000, stock: 22 },
    // زنجیر
    { name: "زنجیر ۴۵ سانت", cat: "necklace-chains", karat: "750", weight: 15, purchase: 60000000, sale: 75000000, stock: 6 },
    { name: "زنجیر ۵۰ سانت", cat: "necklace-chains", karat: "750", weight: 18, purchase: 72000000, sale: 89000000, stock: 5 },
    { name: "زنجیر ظریف ۴۰ سانت", cat: "necklace-chains", karat: "750", weight: 8, purchase: 32000000, sale: 40000000, stock: 12 },
    // پایه عروس
    { name: "پایه عروس الماس", cat: "bridal", karat: "750", weight: 35, purchase: 220000000, sale: 280000000, stock: 1 },
    { name: "پایه عروس ظریف", cat: "bridal", karat: "750", weight: 22, purchase: 145000000, sale: 185000000, stock: 2 },
  ];

  const products: { id: string; name: string; salePrice: number; purchasePrice: number; stock: number; weight: number; karat: string }[] = [];
  let barcodeCounter = 6200000;
  for (let i = 0; i < productsRaw.length; i++) {
    const p = productsRaw[i];
    const catId = slugToId[p.cat];
    const prod = await db.product.create({
      data: {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        categoryId: catId,
        sku: `GH-${String(i + 1).padStart(4, "0")}`,
        barcode: String(barcodeCounter++),
        name: p.name,
        karat: p.karat,
        weight: p.weight,
        makingCharge: p.karat === "999" ? 0 : 150000,
        makingType: "per_gram",
        stoneCost: 0,
        purchasePrice: p.purchase,
        salePrice: p.sale,
        costPrice: p.purchase,
        stock: p.stock,
        minStock: 3,
        status: "active",
        images: JSON.stringify([]),
        description: `${p.name} - ساخت ایران، دارای ضمانت اصالت`,
      },
    });
    products.push(prod);
  }
  console.log(`✓ ${products.length} محصول ایجاد شد`);

  // مشتریان (۳۰ مشتری)
  const customerNames = [
    { name: "زهرا حسینی", phone: "09121234567" },
    { name: "محمد رضایی", phone: "09127654321" },
    { name: "مریم کریمی", phone: "09131112233" },
    { name: "حسین موسوی", phone: "09144445566" },
    { name: "فاطمه نوری", phone: "09157778899" },
    { name: "علی رحیمی", phone: "09161112233" },
    { name: "نرگس احمدی", phone: "09175556677" },
    { name: "رضا صادقی", phone: "09188889900" },
    { name: "سحر جعفری", phone: "09193334455" },
    { name: "محمود قاسمی", phone: "09101112233" },
    { name: "الهام شریفی", phone: "09114445566" },
    { name: "بابک عابدی", phone: "09127778899" },
    { name: "پریسا موسوی", phone: "09132223344" },
    { name: "امیر تهرانی", phone: "09146667788" },
    { name: "سمیرا کاظمی", phone: "09159990011" },
    { name: "حسن مرادی", phone: "09160001122" },
    { name: "اعظم نادری", phone: "09174445566" },
    { name: "مهدی یوسفی", phone: "09185556677" },
    { name: "شکوفه رستمی", phone: "09192223344" },
    { name: "محسن امینی", phone: "09106667788" },
    { name: "دلارا خسروی", phone: "09117778899" },
    { name: "فرید عباسی", phone: "09128889900" },
    { name: "نیلوفر حیدری", phone: "09139990011" },
    { name: "کامران اسدی", phone: "09140001122" },
    { name: "ترانه مظفری", phone: "09151112233" },
    { name: "سعید براتی", phone: "09162223344" },
    { name: "آرزو صالحی", phone: "09173334455" },
    { name: "وحید قنبری", phone: "09184445566" },
    { name: "سمانه ابراهیمی", phone: "09195556677" },
    { name: "پیمان فرهمند", phone: "09106667788" },
  ];
  const customers: { id: string; name: string }[] = [];
  for (let i = 0; i < customerNames.length; i++) {
    const c = customerNames[i];
    const cust = await db.customer.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        phone: c.phone,
        email: i % 3 === 0 ? `customer${i + 1}@example.com` : null,
        address: i % 4 === 0 ? "تهران، خیابان ولیعصر" : null,
        nationalId: i % 2 === 0 ? `00${1000000000 + i}` : null,
        birthday: new Date(1985 + (i % 15), i % 12, (i % 28) + 1),
        loyaltyPoints: 0,
        totalSpent: 0,
        totalOrders: 0,
      },
    });
    customers.push(cust);
  }
  console.log(`✓ ${customers.length} مشتری ایجاد شد`);

  // قیمت طلا (تاریخچه ۳۰ روز)
  const basePrices: Record<string, number> = {
    "999": 3200000,
    "916": 2950000,
    "750": 2450000,
    "585": 1950000,
    "417": 1450000,
  };
  for (let day = 30; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(10, 0, 0, 0);
    const fluctuation = 1 + (Math.sin(day) * 0.02) + ((30 - day) * 0.003);
    for (const [karat, base] of Object.entries(basePrices)) {
      await db.goldPrice.create({
        data: {
          tenantId: tenant.id,
          karat,
          pricePerGram: Math.round(base * fluctuation),
          source: "manual",
          createdAt: date,
        },
      });
    }
  }
  console.log("✓ تاریخچه قیمت طلا (۳۰ روز) ایجاد شد");

  // تولید فروش‌ها در ۶۰ روز گذشته (حدود ۴۰۰ فروش)
  console.log("💰 در حال تولید فروش‌ها...");
  let invoiceCounter = 5000;
  const cashiers = [cashier1, cashier2, manager1, staff1];
  const branches = [mainBranch, branch2, branch3];
  let totalSalesCreated = 0;

  for (let day = 59; day >= 0; day--) {
    const salesPerDay = Math.floor(Math.random() * 8) + 3; // 3-10 فروش در روز
    for (let s = 0; s < salesPerDay; s++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(Math.floor(Math.random() * 11) + 9, Math.floor(Math.random() * 60));

      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items: { productId: string; name: string; karat: string; weight: number; makingCharge: number; unitPrice: number; quantity: number; total: number }[] = [];
      const usedProducts = new Set<string>();

      for (let it = 0; it < numItems; it++) {
        let prod = products[Math.floor(Math.random() * products.length)];
        let attempts = 0;
        while (usedProducts.has(prod.id) && attempts < 5) {
          prod = products[Math.floor(Math.random() * products.length)];
          attempts++;
        }
        usedProducts.add(prod.id);
        const qty = 1;
        const itemTotal = prod.salePrice * qty;
        subtotal += itemTotal;
        items.push({
          productId: prod.id,
          name: prod.name,
          karat: prod.karat,
          weight: prod.weight,
          makingCharge: prod.makingCharge,
          unitPrice: prod.salePrice,
          quantity: qty,
          total: itemTotal,
        });
      }

      const discount = Math.random() > 0.75 ? Math.floor(subtotal * (Math.random() * 0.1 + 0.02)) : 0;
      const tax = 0;
      const total = subtotal - discount + tax;
      invoiceCounter++;
      const customer = Math.random() > 0.3 ? customers[Math.floor(Math.random() * customers.length)] : null;
      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const branch = branches[Math.floor(Math.random() * branches.length)];

      const sale = await db.sale.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          invoiceNumber: `INV-${invoiceCounter}`,
          customerId: customer?.id,
          cashierId: cashier.id,
          subtotal,
          discount,
          tax,
          makingTotal: 0,
          total,
          paymentMethod: ["cash", "card", "transfer", "cash", "card"][Math.floor(Math.random() * 5)],
          paymentStatus: Math.random() > 0.05 ? "paid" : "partial",
          status: Math.random() > 0.02 ? "completed" : "void",
          createdAt: date,
          items: { create: items },
        },
      });

      // فقط برای فروش‌های کامل، موجودی و آمار مشتری را به‌روز کن
      if (sale.status === "completed") {
        if (customer) {
          await db.customer.update({
            where: { id: customer.id },
            data: {
              totalSpent: { increment: total },
              totalOrders: { increment: 1 },
              loyaltyPoints: { increment: Math.floor(total / 100000) },
            },
          });
        }
        for (const item of items) {
          // موجودی را کم نکن چون قبلا کم شده در seed اول - فقط حرکت ثبت کن
          await db.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: item.productId,
              toBranchId: branch.id,
              type: "sale",
              quantity: -item.quantity,
              reason: `فروش ${sale.invoiceNumber}`,
              refId: sale.id,
              createdAt: date,
            },
          });
        }
      }
      totalSalesCreated++;
    }
  }
  console.log(`✓ ${totalSalesCreated} فروش ثبت شد`);

  // هزینه‌ها در ۶۰ روز
  const expenseTemplates = [
    { category: "rent", description: "اجاره شعبه مرکزی", amount: 35000000 },
    { category: "rent", description: "اجاره شعبه اصفهان", amount: 25000000 },
    { category: "rent", description: "اجاره شعبه شیراز", amount: 20000000 },
    { category: "salary", description: "حقوق کارکنان شعبه مرکزی", amount: 120000000 },
    { category: "salary", description: "حقوق کارکنان اصفهان", amount: 65000000 },
    { category: "salary", description: "حقوق کارکنان شیراز", amount: 45000000 },
    { category: "salary", description: "حقوق استاد زرگر", amount: 35000000 },
    { category: "utilities", description: "قبض برق و آب", amount: 4200000 },
    { category: "utilities", description: "اینترنت و تلفن", amount: 1800000 },
    { category: "utilities", description: "گاز", amount: 1200000 },
    { category: "supplies", description: "خرید مواد اولیه - شمش طلا", amount: 850000000 },
    { category: "supplies", description: "خرید سنگ‌های قیمتی", amount: 120000000 },
    { category: "supplies", description: "خرید تجهیزات کارگاه", amount: 25000000 },
    { category: "marketing", description: "تبلیغات اینستاگرام", amount: 15000000 },
    { category: "marketing", description: "تبلیغات تلویزیونی", amount: 80000000 },
    { category: "marketing", description: "طراحی سایت و سئو", amount: 35000000 },
    { category: "other", description: "هزینه بیمه", amount: 18000000 },
    { category: "other", description: "تعمیرات", amount: 8000000 },
    { category: "other", description: "مالیات", amount: 95000000 },
  ];
  for (let day = 0; day < 60; day += 7) {
    for (const e of expenseTemplates) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(10 + Math.floor(Math.random() * 8));
      await db.expense.create({
        data: {
          tenantId: tenant.id,
          branchId: branches[Math.floor(Math.random() * branches.length)].id,
          category: e.category,
          description: e.description,
          amount: e.amount,
          date,
        },
      });
    }
  }
  console.log("✓ هزینه‌ها ثبت شد");

  // صندوق‌های فروش
  for (const b of branches) {
    await db.cashbox.create({
      data: {
        tenantId: tenant.id,
        branchId: b.id,
        name: `صندوق ${b.name}`,
        balance: Math.floor(Math.random() * 50000000) + 10000000,
        openingBalance: 5000000,
        status: "open",
        openedAt: new Date(new Date().setHours(8, 0, 0, 0)),
      },
    });
  }
  console.log("✓ صندوق‌های فروش ایجاد شد");

  // سفارشات سفارشی و تعمیرات (۲۰ سفارش)
  console.log("📋 در حال ایجاد سفارشات...");
  const orderTypes = ["custom", "repair", "manufacturing"];
  const orderStatuses = ["pending", "design", "manufacturing", "polishing", "ready", "delivered"];
  const orderTitles = [
    "انگشتر نام سفارشی با نگین الماس",
    "نیم‌ست عروسی طراحی اختصاصی",
    "تعمیر گیره گردنبند",
    "بازسازی انگشتر قدیمی",
    "ساخت نشان عروسی دو رنگ",
    "تعمیر زنجیر پاره",
    "ساخت دستبند سفارشی",
    "نگین‌گذاری انگشتر",
    "رنگ‌بری جواهر",
    "ساعت طلا سفارشی",
    "تنگسیر باف اسپانیایی",
    "گراوور کردن انگشتر",
    "ساخت گردنبند کودک",
    "تعمیر قفل دستبند",
    "ساخت گوشواره ست",
    "انگشتر نامزدی با الماس",
    "نیم‌ست نگین زمرد",
    "تعمیر پلاک طلا",
    "ساخت پایه عروس",
    "بازسازی نیم‌ست قدیمی",
  ];

  for (let i = 0; i < 20; i++) {
    const type = orderTypes[i % 3];
    const statusIndex = Math.floor(Math.random() * (orderStatuses.length + 2));
    const status = statusIndex >= orderStatuses.length ? "delivered" : orderStatuses[statusIndex];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const deadline = new Date(date.getTime() + (Math.floor(Math.random() * 21) + 7) * 24 * 60 * 60 * 1000);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const assignedTo = goldsmith.id;

    const goldWeight = Math.floor(Math.random() * 30) + 3;
    const karat = ["750", "916", "999"][Math.floor(Math.random() * 3)];
    const makingCharge = Math.floor(Math.random() * 5000000) + 1000000;
    const stoneCost = Math.random() > 0.5 ? Math.floor(Math.random() * 50000000) + 5000000 : 0;
    const estimatedCost = goldWeight * 2500000 + makingCharge + stoneCost;
    const finalCost = status === "delivered" ? estimatedCost + Math.floor(Math.random() * 5000000) : 0;

    const order = await db.customOrder.create({
      data: {
        tenantId: tenant.id,
        orderNumber: `ORD-${5000 + i}`,
        customerId: customer.id,
        type,
        title: orderTitles[i],
        description: `سفارش ${type === "repair" ? "تعمیر" : type === "manufacturing" ? "ساخت" : "سفارشی"} - ${orderTitles[i]}`,
        status,
        goldWeight,
        karat,
        makingCharge,
        stoneCost,
        estimatedCost,
        finalCost,
        assignedToId: assignedTo,
        deadline,
        createdAt: date,
      },
    });

    // تایم‌لاین بر اساس وضعیت
    const stagesUntil = orderStatuses.indexOf(status);
    if (stagesUntil >= 0 || status === "delivered") {
      const allStages = status === "delivered" ? orderStatuses : orderStatuses.slice(0, stagesUntil + 1);
      for (let j = 0; j < allStages.length; j++) {
        const stageDate = new Date(date.getTime() + j * 2 * 24 * 60 * 60 * 1000);
        if (stageDate > new Date()) continue;
        const notes = [
          "سفارش ثبت شد",
          "طراحی اولیه انجام شد",
          "مرحله ساخت آغاز شد",
          "پرداخت و صیقلکاری",
          "آماده تحویل شد",
          "به مشتری تحویل داده شد",
        ];
        await db.orderTimeline.create({
          data: {
            orderId: order.id,
            status: allStages[j],
            note: notes[j] || "",
            createdAt: stageDate,
          },
        });
      }
    }
  }
  console.log("✓ ۲۰ سفارش با تایم‌لاین ایجاد شد");

  // انتقال‌های بین انباری
  const transferProducts = products.slice(0, 10);
  for (let i = 0; i < 5; i++) {
    const fromBranch = i % 2 === 0 ? warehouse : mainBranch;
    const toBranch = i % 2 === 0 ? mainBranch : branch2;
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: { productId: string; name: string; qty: number }[] = [];
    for (let j = 0; j < numItems; j++) {
      const p = transferProducts[Math.floor(Math.random() * transferProducts.length)];
      items.push({ productId: p.id, name: p.name, qty: Math.floor(Math.random() * 5) + 1 });
    }
    const status = ["pending", "in_transit", "received"][i % 3];
    const date = new Date();
    date.setDate(date.getDate() - (5 - i) * 2);
    await db.transfer.create({
      data: {
        tenantId: tenant.id,
        fromBranchId: fromBranch.id,
        toBranchId: toBranch.id,
        reference: `TRF-${6000 + i}`,
        status,
        itemsJson: JSON.stringify(items),
        notes: "انتقال بین انباری",
        createdAt: date,
      },
    });
  }
  console.log("✓ ۵ انتقال انباری ایجاد شد");

  // هشدارها
  const lowStockProducts = await db.product.findMany({
    where: { tenantId: tenant.id, stock: { lte: 3 } },
  });
  for (const p of lowStockProducts) {
    await db.alert.create({
      data: {
        tenantId: tenant.id,
        type: "low_stock",
        severity: p.stock === 0 ? "critical" : "warning",
        title: p.stock === 0 ? "ناموجود" : "موجودی کم",
        message: `محصول «${p.name}» ${p.stock === 0 ? "ناموجود شده است" : `رو به اتمام است (${p.stock} عدد باقی مانده)`}`,
      },
    });
  }
  await db.alert.create({
    data: {
      tenantId: tenant.id,
      type: "price_change",
      severity: "info",
      title: "صعود قیمت طلا",
      message: "قیمت طلا در ۲۴ ساعت گذشته ۲.۳٪ افزایش یافته است",
    },
  });
  await db.alert.create({
    data: {
      tenantId: tenant.id,
      type: "order_deadline",
      severity: "warning",
      title: "مهلت تحویل نزدیک",
      message: "۳ سفارش سفارشی تا ۳ روز آینده باید تحویل داده شوند",
    },
  });
  console.log(`✓ ${lowStockProducts.length + 2} هشدار ایجاد شد`);

  // اعلان‌ها برای کاربران
  for (const u of [admin, cashier1, manager1]) {
    await db.notification.create({
      data: {
        userId: u.id,
        title: "خوش آمدید به گلد هاب",
        message: "سیستم مدیریت طلا و جواهر زرین شهر آماده استفاده است.",
        type: "info",
      },
    });
    await db.notification.create({
      data: {
        userId: u.id,
        title: "فروش جدید ثبت شد",
        message: "یک فاکتور جدید با موفقیت ثبت شد.",
        type: "success",
        createdAt: new Date(Date.now() - 3600000),
      },
    });
  }
  console.log("✓ اعلان‌ها ایجاد شد");

  // لاگ‌های ممیزی
  const auditActions = [
    { userId: admin.id, action: "login", entity: "User", entityId: admin.id, details: { email: admin.email } },
    { userId: cashier1.id, action: "login", entity: "User", entityId: cashier1.id, details: { email: cashier1.email } },
    { userId: admin.id, action: "create", entity: "Product", entityId: products[0].id, details: { name: products[0].name } },
    { userId: admin.id, action: "update", entity: "Product", entityId: products[1].id, details: { field: "salePrice" } },
    { userId: cashier1.id, action: "create", entity: "Sale", details: { invoice: "INV-5001" } },
    { userId: manager1.id, action: "create", entity: "Customer", details: { name: "زهرا حسینی" } },
    { userId: admin.id, action: "create", entity: "Order", details: { type: "custom" } },
    { userId: admin.id, action: "update", entity: "Tenant", entityId: tenant.id, details: { field: "settings" } },
    { userId: cashier2.id, action: "login", entity: "User", details: { email: cashier2.email } },
    { userId: admin.id, action: "create", entity: "Branch", details: { name: "شعبه شیراز" } },
  ];
  for (let i = 0; i < auditActions.length; i++) {
    const a = auditActions[i];
    const date = new Date();
    date.setHours(date.getHours() - i * 3);
    await db.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId || null,
        details: JSON.stringify(a.details),
        ip: `192.168.1.${100 + i}`,
        createdAt: date,
      },
    });
  }
  console.log("✓ لاگ‌های ممیزی ایجاد شد");

  console.log("\n🎉 seed کامل با موفقیت انجام شد!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 آمار:");
  console.log(`  • ${products.length} محصول`);
  console.log(`  • ${customers.length} مشتری`);
  console.log(`  • ${totalSalesCreated} فروش`);
  console.log(`  • ۲۰ سفارش`);
  console.log(`  • ۴ شعبه`);
  console.log(`  • ۶ کاربر`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 ورود: admin@goldhub.ir");
  console.log("🔐 رمز: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
