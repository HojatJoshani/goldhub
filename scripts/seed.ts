import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🌱 شروع seed داده‌های گلد هاب...");

  // Create tenant
  const tenant = await db.tenant.upsert({
    where: { slug: "goldhub-demo" },
    update: {},
    create: {
      name: "طلا و جواهر گلد هاب",
      slug: "goldhub-demo",
      plan: "enterprise",
      status: "active",
      settings: JSON.stringify({
        currency: "toman",
        taxRate: 0.09,
        goldPriceAuto: false,
      }),
    },
  });
  console.log("✓ tenant ایجاد شد:", tenant.name);

  // Create branches
  const mainBranch = await db.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      tenantId: tenant.id,
      name: "شعبه مرکزی - تهران",
      code: "TEH-01",
      address: "تهران، بازار بزرگ طلا",
      phone: "021-55551234",
      isMain: true,
      status: "active",
    },
  });

  const branch2 = await db.branch.upsert({
    where: { id: "branch-2" },
    update: {},
    create: {
      id: "branch-2",
      tenantId: tenant.id,
      name: "شعبه اصفهان",
      code: "ISF-01",
      address: "اصفهان، بازار قیصریه",
      phone: "031-55559876",
      status: "active",
    },
  });

  const warehouse = await db.branch.upsert({
    where: { id: "warehouse-1" },
    update: {},
    create: {
      id: "warehouse-1",
      tenantId: tenant.id,
      name: "انبار مرکزی",
      code: "WH-01",
      isWarehouse: true,
      status: "active",
    },
  });
  console.log("✓ شعبات ایجاد شدند");

  // Create admin user
  const passwordHash = await hashPassword("admin123");
  const admin = await db.user.upsert({
    where: { email: "admin@goldhub.ir" },
    update: {},
    create: {
      email: "admin@goldhub.ir",
      passwordHash,
      name: "مدیر سیستم",
      role: "super_admin",
      status: "active",
      tenantId: tenant.id,
      branchId: mainBranch.id,
    },
  });
  console.log("✓ کاربر مدیر ایجاد شد: admin@goldhub.ir / admin123");

  // Create staff users
  const staffPass = await hashPassword("staff123");
  await db.user.upsert({
    where: { email: "cashier@goldhub.ir" },
    update: {},
    create: {
      email: "cashier@goldhub.ir",
      passwordHash: staffPass,
      name: "علی محمدی",
      role: "cashier",
      tenantId: tenant.id,
      branchId: mainBranch.id,
    },
  });
  await db.user.upsert({
    where: { email: "manager@goldhub.ir" },
    update: {},
    create: {
      email: "manager@goldhub.ir",
      passwordHash: staffPass,
      name: "فاطمه احمدی",
      role: "manager",
      tenantId: tenant.id,
      branchId: branch2.id,
    },
  });
  console.log("✓ کاربران کارکنان ایجاد شدند");

  // Categories
  const categories = [
    { name: "نشان عروسی", slug: "wedding-bands" },
    { name: "انگشتر", slug: "rings" },
    { name: "گردنبند", slug: "necklaces" },
    { name: "دستبند", slug: "bracelets" },
    { name: "نیم‌ست", slug: "sets" },
    { name: "تنگسیر", slug: "chains" },
    { name: "پلاک طلا", slug: "coins" },
    { name: "بچگی", slug: "kids" },
  ];
  const categoryMap: Record<string, string> = {};
  for (const c of categories) {
    const cat = await db.category.create({
      data: { tenantId: tenant.id, name: c.name, slug: c.slug },
    });
    categoryMap[c.slug] = cat.id;
  }
  console.log("✓ دسته‌بندی‌ها ایجاد شد");

  // Products
  const products = [
    { name: "نشان عروسی ساده ۷۵۰", cat: "wedding-bands", karat: "750", weight: 4.5, purchase: 18000000, sale: 22000000, stock: 12, barcode: "6200001" },
    { name: "انگشتر مردانه سنگ نیم‌قیمت", cat: "rings", karat: "750", weight: 8.2, purchase: 32000000, sale: 41000000, stock: 5, barcode: "6200002" },
    { name: "گردنبند ژولیا", cat: "necklaces", karat: "750", weight: 12.3, purchase: 49000000, sale: 62000000, stock: 8, barcode: "6200003" },
    { name: "دستبند فیلیگرین", cat: "bracelets", karat: "916", weight: 15.8, purchase: 72000000, sale: 89000000, stock: 3, barcode: "6200004" },
    { name: "نیم‌ست الماس", cat: "sets", karat: "750", weight: 22.5, purchase: 145000000, sale: 185000000, stock: 2, barcode: "6200005" },
    { name: "تنگسیر ظریف ۵۰", cat: "chains", karat: "750", weight: 50, purchase: 200000000, sale: 245000000, stock: 4, barcode: "6200006" },
    { name: "پلاک امیرالمومنین", cat: "coins", karat: "999", weight: 8.13, purchase: 33000000, sale: 35500000, stock: 50, barcode: "6200007" },
    { name: "انگشتر زنانه نگین دار", cat: "rings", karat: "750", weight: 5.8, purchase: 23000000, sale: 29500000, stock: 9, barcode: "6200008" },
    { name: "گردنبند قلب", cat: "necklaces", karat: "585", weight: 6.4, purchase: 18000000, sale: 23500000, stock: 15, barcode: "6200009" },
    { name: "دستبند اسلیو", cat: "bracelets", karat: "750", weight: 9.8, purchase: 39000000, sale: 49000000, stock: 6, barcode: "6200010" },
    { name: "نشان دو رنگ", cat: "wedding-bands", karat: "750", weight: 5.2, purchase: 21000000, sale: 26500000, stock: 1, barcode: "6200011" },
    { name: "بچگی پروانه", cat: "kids", karat: "585", weight: 3.2, purchase: 9000000, sale: 12500000, stock: 20, barcode: "6200012" },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i] as any;
    await db.product.create({
      data: {
        tenantId: tenant.id,
        branchId: mainBranch.id,
        categoryId: categoryMap[p.cat],
        sku: `GH-${String(i + 1).padStart(4, "0")}`,
        barcode: p.barcode,
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
      },
    });
  }
  console.log(`✓ ${products.length} محصول ایجاد شد`);

  // Customers
  const customerData = [
    { name: "زهرا حسینی", phone: "09121234567", loyalty: 1250, totalSpent: 89000000 },
    { name: "محمد رضایی", phone: "09127654321", loyalty: 850, totalSpent: 62000000 },
    { name: "مریم کریمی", phone: "09131112233", loyalty: 2100, totalSpent: 145000000 },
    { name: "حسین موسوی", phone: "09144445566", loyalty: 320, totalSpent: 25000000 },
    { name: "فاطمه نوری", phone: "09157778899", loyalty: 1800, totalSpent: 120000000 },
  ];
  for (const c of customerData) {
    await db.customer.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        phone: c.phone,
        loyaltyPoints: c.loyalty,
        totalSpent: c.totalSpent,
        totalOrders: Math.floor(c.loyalty / 100),
        birthday: new Date(1990, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      },
    });
  }
  console.log(`✓ ${customerData.length} مشتری ایجاد شد`);

  // Gold prices
  const goldPrices = [
    { karat: "999", price: 3200000 },
    { karat: "916", price: 2950000 },
    { karat: "750", price: 2450000 },
    { karat: "585", price: 1950000 },
    { karat: "417", price: 1450000 },
  ];
  for (const g of goldPrices) {
    await db.goldPrice.create({
      data: {
        tenantId: tenant.id,
        karat: g.karat,
        pricePerGram: g.price,
        source: "manual",
      },
    });
  }
  console.log("✓ قیمت‌های طلا ثبت شد");

  // Generate some sales over the last 30 days
  const allProducts = await db.product.findMany({ where: { tenantId: tenant.id } });
  const customers = await db.customer.findMany({ where: { tenantId: tenant.id } });
  let invoiceCounter = 1000;
  for (let day = 29; day >= 0; day--) {
    const salesPerDay = Math.floor(Math.random() * 5) + 1;
    for (let s = 0; s < salesPerDay; s++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items: any[] = [];
      for (let it = 0; it < numItems; it++) {
        const prod = allProducts[Math.floor(Math.random() * allProducts.length)];
        const qty = 1;
        const total = prod.salePrice * qty;
        subtotal += total;
        items.push({
          productId: prod.id,
          name: prod.name,
          karat: prod.karat,
          weight: prod.weight,
          makingCharge: prod.makingCharge,
          unitPrice: prod.salePrice,
          quantity: qty,
          total,
        });
      }
      const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.05) : 0;
      const tax = 0;
      const total = subtotal - discount + tax;
      invoiceCounter++;
      const customer = Math.random() > 0.4 ? customers[Math.floor(Math.random() * customers.length)] : null;
      const sale = await db.sale.create({
        data: {
          tenantId: tenant.id,
          branchId: mainBranch.id,
          invoiceNumber: `INV-${invoiceCounter}`,
          customerId: customer?.id,
          cashierId: admin.id,
          subtotal,
          discount,
          tax,
          makingTotal: 0,
          total,
          paymentMethod: ["cash", "card", "transfer"][Math.floor(Math.random() * 3)],
          paymentStatus: "paid",
          status: "completed",
          createdAt: date,
          items: { create: items },
        },
      });
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
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await db.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: item.productId,
            toBranchId: mainBranch.id,
            type: "sale",
            quantity: -item.quantity,
            reason: `فروش ${sale.invoiceNumber}`,
            refId: sale.id,
          },
        });
      }
    }
  }
  console.log(`✓ ${invoiceCounter - 1000} فروش ثبت شد`);

  // Expenses
  const expenses = [
    { category: "rent", description: "اجاره شعبه", amount: 25000000 },
    { category: "salary", description: "حقوق کارکنان", amount: 85000000 },
    { category: "utilities", description: "قبض برق و آب", amount: 3200000 },
    { category: "supplies", description: "خرید مواد اولیه", amount: 45000000 },
    { category: "marketing", description: "تبلیغات اینستاگرام", amount: 8000000 },
  ];
  for (let day = 0; day < 30; day += 7) {
    for (const e of expenses) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      await db.expense.create({
        data: {
          tenantId: tenant.id,
          branchId: mainBranch.id,
          category: e.category,
          description: e.description,
          amount: e.amount,
          date,
        },
      });
    }
  }
  console.log("✓ هزینه‌ها ثبت شد");

  // Cashbox
  await db.cashbox.create({
    data: {
      tenantId: tenant.id,
      branchId: mainBranch.id,
      name: "صندوق اصلی",
      balance: 45800000,
      openingBalance: 5000000,
      status: "open",
      openedAt: new Date(),
    },
  });

  // Alerts
  const lowStockProducts = await db.product.findMany({
    where: { tenantId: tenant.id, stock: { lte: 3 } },
  });
  for (const p of lowStockProducts) {
    await db.alert.create({
      data: {
        tenantId: tenant.id,
        type: "low_stock",
        severity: "warning",
        title: "موجودی کم",
        message: `محصول "${p.name}" رو به اتمام است (${p.stock} عدد باقی مانده)`,
      },
    });
  }
  await db.alert.create({
    data: {
      tenantId: tenant.id,
      type: "price_change",
      severity: "info",
      title: "به‌روزرسانی قیمت طلا",
      message: "قیمت طلا در ۲۴ ساعت گذشته ۲.۳٪ افزایش یافته است",
    },
  });
  console.log("✓ هشدارها ایجاد شد");

  console.log("\n🎉 seed با موفقیت انجام شد!");
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
