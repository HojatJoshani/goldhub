import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isDbAvailable } from "@/lib/db-check";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "@/lib/demo-data";

function slugify(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;

    // Check if database is available
    if (!(await isDbAvailable())) {
      return NextResponse.json(getDemoCategories());
    }

    try {
      const categories = await db.category.findMany({
        where: { tenantId },
        orderBy: { name: "asc" },
        include: {
          _count: { select: { products: true } },
        },
      });

      return NextResponse.json({ items: categories });
    } catch (dbError) {
      console.error("Categories DB error, using demo:", dbError);
      return NextResponse.json(getDemoCategories());
    }
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت دسته‌بندی‌ها" },
      { status: 500 }
    );
  }
}

/**
 * Demo categories data for when database is not available (Vercel)
 */
function getDemoCategories() {
  const items = DEMO_CATEGORIES.map((c) => ({
    ...c,
    _count: { products: DEMO_PRODUCTS.filter((p) => p.categoryId === c.id).length },
  }));
  return { items };
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "احراز هویت نشده" },
        { status: 401 }
      );
    }
    const tenantId = user.tenantId;

    const body = await req.json();
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "نام دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    let slug = body.slug?.trim() || slugify(name);

    // Ensure slug uniqueness within tenant
    let suffix = 1;
    let uniqueSlug = slug;
    while (true) {
      const exists = await db.category.findFirst({
        where: { tenantId, slug: uniqueSlug },
      });
      if (!exists) break;
      uniqueSlug = `${slug}-${suffix++}`;
    }

    const category = await db.category.create({
      data: {
        tenantId,
        name,
        slug: uniqueSlug,
        parentId: body.parentId || null,
        description: body.description?.trim() || null,
      },
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json(
      { error: "خطا در ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}
