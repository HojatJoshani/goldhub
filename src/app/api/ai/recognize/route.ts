import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 90;

interface RecognitionData {
  type?: string;
  karat?: string;
  estimatedWeight?: string | number;
  stones?: string;
  style?: string;
  estimatedValueRange?: string;
  description?: string;
  confidence?: string;
}

function extractJson(text: string): RecognitionData | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  const raw = text.slice(start, end + 1);
  try {
    return JSON.parse(raw) as RecognitionData;
  } catch {
    return null;
  }
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

    let body: { image?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "بدنه درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    const image = (body.image || "").trim();
    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "تصویر معتبری ارسال نشده است" },
        { status: 400 }
      );
    }

    if (image.length > 11_000_000) {
      return NextResponse.json(
        { error: "حجم تصویر بیش از حد مجاز است" },
        { status: 413 }
      );
    }

    const prompt =
      "این تصویر یک محصول طلا/جواهر است. ویژگی‌ها را به فرمت JSON استخراج کن و فقط JSON برگردان (بدون متن اضافه). ساختار:\n" +
      JSON.stringify(
        {
          type: "ring | necklace | bracelet | earring | chain | pendant | bangle | coin | other",
          karat: "عیار تخمینی (24/22/18/14/10)",
          estimatedWeight: "وزن تخمینی به گرم (عدد)",
          stones: "نوع سنگ‌ها (مثل الماس، زمرد، بدون سنگ) یا null",
          style: "سبک طراحی (سنتی، مدرن، مینیمال و ...)",
          estimatedValueRange: "بازه ارزش تخمینی به تومان",
          description: "توضیح کوتاه فارسی",
          confidence: "low | medium | high",
        },
        null,
        2
      ) +
      "\nاگر فیلدی قابل تشخیص نیست آن را حذف کن. اعداد را به انگلیسی بنویس.";

    let parsed: RecognitionData | null = null;
    let rawOutput = "";

    try {
      const zai = await ZAI.create();
      // SDK exposes createVision at runtime (multimodal / image_url endpoint)
      const createVision = (zai.chat.completions as unknown as {
        createVision: (body: Record<string, unknown>) => Promise<{
          choices?: { message?: { content?: string } }[];
        }>;
      }).createVision;
      const completion = await createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.2,
        max_tokens: 900,
      });
      rawOutput =
        completion?.choices?.[0]?.message?.content?.trim() || "";
    } catch (aiErr) {
      console.error("AI recognize error:", aiErr);
      return NextResponse.json(
        { error: "خطا در ارتباط با سرویس هوش مصنوعی" },
        { status: 502 }
      );
    }

    parsed = extractJson(rawOutput);

    if (!parsed) {
      await db.aIQuery.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          type: "image_recognition",
          input: "[image]",
          output: rawOutput || "(empty)",
          meta: JSON.stringify({ status: "parse_failed" }),
        },
      });
      return NextResponse.json(
        {
          error: "امکان تشخیص ساختار JSON از تصویر نبود. لطفاً تصویر واضح‌تری ارسال کنید.",
          raw: rawOutput,
        },
        { status: 422 }
      );
    }

    const record = await db.aIQuery.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        type: "image_recognition",
        input: "[image]",
        output: JSON.stringify(parsed),
        meta: JSON.stringify({ status: "ok" }),
      },
    });

    return NextResponse.json({
      data: parsed,
      queryId: record.id,
      createdAt: record.createdAt,
    });
  } catch (error) {
    console.error("AI recognize route error:", error);
    return NextResponse.json(
      { error: "خطای سرور در پردازش تصویر" },
      { status: 500 }
    );
  }
}
