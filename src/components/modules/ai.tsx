"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ScanLine,
  Camera,
  MessageSquare,
  History,
  Send,
  Bot,
  User as UserIcon,
  Upload,
  Trash2,
  Plus,
  Loader2,
  FileText,
  Gem,
  Image as ImageIcon,
  AlertCircle,
  Store,
  Calendar,
  Receipt,
  Coins,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  formatPersianDateTime,
  formatToman,
  toPersianDigits,
} from "@/lib/persian";

// ============================================================================
// Types
// ============================================================================

type ChatRole = "user" | "assistant";
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
}

interface InvoiceItem {
  name?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}
interface InvoiceData {
  seller?: string;
  date?: string;
  items?: InvoiceItem[];
  totalAmount?: number;
  tax?: number;
}

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

interface HistoryItem {
  id: string;
  type: "text_query" | "ocr_scan" | "image_recognition";
  typeLabel: string;
  input: string;
  output: string;
  createdAt: string;
}

// ============================================================================
// Helpers
// ============================================================================

const SUGGESTED_QUESTIONS = [
  "فروش امروز چقدر بوده؟",
  "پرفروش‌ترین محصولات کدامند؟",
  "موجودی کم کدام محصولات است؟",
  "سود این ماه چقدر است؟",
];

const TYPE_BADGE: Record<
  HistoryItem["type"],
  { label: string; cls: string; icon: React.ElementType }
> = {
  text_query: {
    label: "پرسش متنی",
    cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    icon: MessageSquare,
  },
  ocr_scan: {
    label: "اسکن فاکتور",
    cls:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    icon: ScanLine,
  },
  image_recognition: {
    label: "تشخیص محصول",
    cls:
      "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    icon: Camera,
  },
};

function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ============================================================================
// Main Component
// ============================================================================

export function AiModule() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              دستیار هوش مصنوعی گلد هاب
            </h1>
            <p className="text-sm text-muted-foreground">
              پرسش از داده‌ها، اسکن فاکتور و تشخیص محصولات با هوش مصنوعی
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-800"
        >
          <Sparkles className="h-3.5 w-3.5" />
          قدرت‌گرفته از Z-AI
        </Badge>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto scrollbar-hide bg-muted/60 p-1 sm:w-auto sm:overflow-visible">
          <TabsTrigger value="chat" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline">دستیار هوشمند</span>
            <span className="xs:hidden">دستیار</span>
          </TabsTrigger>
          <TabsTrigger value="ocr" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
            <ScanLine className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline">اسکن فاکتور</span>
            <span className="xs:hidden">اسکن</span>
          </TabsTrigger>
          <TabsTrigger value="recognize" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
            <Camera className="h-4 w-4 shrink-0" />
            <span className="hidden xs:inline">تشخیص محصول</span>
            <span className="xs:hidden">تشخیص</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm">
            <History className="h-4 w-4 shrink-0" />
            تاریخچه
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <ChatTab />
        </TabsContent>
        <TabsContent value="ocr" className="mt-4">
          <OcrTab />
        </TabsContent>
        <TabsContent value="recognize" className="mt-4">
          <RecognizeTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Tab 1: Chat
// ============================================================================

function ChatTab() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendQuestion(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { id: genId(), role: "user", content: q };
    const pendingMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "خطا در ارتباط با سرور");
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? { ...m, content: data.answer || "پاسخی دریافت نشد.", pending: false }
            : m
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(msg);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMsg.id
            ? {
                ...m,
                content: `❌ ${msg}`,
                pending: false,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendQuestion(input);
  }

  function clearChat() {
    setMessages([]);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-amber-500" />
              گفتگو با دستیار
            </CardTitle>
            <CardDescription className="mt-1">
              درباره فروش، انبار، مشتریان و مالی بپرسید
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4 ml-1" />
              پاک کردن
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="h-[55vh] max-h-[520px] min-h-[320px] overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 bg-muted/30 scrollbar-thin"
        >
          {messages.length === 0 ? (
            <EmptyChat onPick={sendQuestion} />
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>

        {/* Suggested chips */}
        <div className="border-t bg-card px-3 pt-3 sm:px-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={loading}
                onClick={() => sendQuestion(q)}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
              >
                <Sparkles className="h-3 w-3 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 flex items-end gap-2 border-t bg-card p-3 sm:p-4 safe-bottom"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendQuestion(input);
              }
            }}
            placeholder="سوال خود را بنویسید... (Enter برای ارسال)"
            rows={2}
            disabled={loading}
            className="resize-none bg-background min-h-[44px]"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">ارسال</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EmptyChat({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30">
        <Sparkles className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">
        به دستیار هوشمند گلد هاب خوش آمدید
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        هر سؤالی درباره فروش، انبار، مشتریان یا وضعیت مالی فروشگاه خود دارید
        بپرسید یا یکی از پیشنهادهای زیر را انتخاب کنید.
      </p>
      <div className="mt-5 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-right text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/60"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow",
          isUser
            ? "bg-slate-600"
            : "bg-gradient-to-br from-amber-400 to-amber-600"
        )}
      >
        {isUser ? (
          <UserIcon className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : "bg-card border border-amber-200/70 text-card-foreground dark:border-amber-900/50"
        )}
      >
        {message.pending ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>در حال تفکر…</span>
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div
            className={
              "min-w-0 [&_p]:my-1.5 [&_p]:break-words [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pr-4 " +
              "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pr-4 " +
              "[&_li]:my-0.5 [&_strong]:font-bold " +
              "[&_h1]:mb-1 [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-bold " +
              "[&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold " +
              "[&_h3]:mb-1 [&_h3]:mt-1.5 [&_h3]:text-sm [&_h3]:font-semibold " +
              "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs " +
              "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-xs " +
              "[&_blockquote]:border-r-2 [&_blockquote]:border-amber-400 [&_blockquote]:pr-2 [&_blockquote]:text-muted-foreground " +
              "[&_a]:text-amber-600 [&_a]:underline dark:[&_a]:text-amber-400 " +
              "[&_table]:my-2 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse " +
              "[&_th]:border [&_th]:p-1 [&_th]:text-xs [&_th]:whitespace-nowrap " +
              "[&_td]:border [&_td]:p-1 [&_td]:text-xs [&_td]:align-top"
            }
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab 2: OCR
// ============================================================================

function OcrTab() {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<InvoiceData | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۸ مگابایت باشد");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImage(dataUrl);
      setResult(null);
    } catch {
      toast.error("خواندن فایل ناموفق بود");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleScan() {
    if (!image) {
      toast.error("ابتدا تصویر فاکتور را بارگذاری کنید");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "خطا در اسکن تصویر");
      }
      setResult(data.data as InvoiceData);
      toast.success("فاکتور با موفقیت اسکن شد");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-amber-500" />
            بارگذاری فاکتور
          </CardTitle>
          <CardDescription>
            تصویر فاکتور یا رسید را بارگذاری کنید تا اطلاعات آن استخراج شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onInputChange}
          />
          {!image ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                "flex w-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10",
                dragOver
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                  : "border-muted-foreground/30 hover:border-amber-400 hover:bg-muted/40"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Upload className="h-7 w-7" />
              </div>
              <div>
                <p className="font-medium">برای انتخاب کلیک کنید</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  یا تصویر را اینجا رها کنید (حداکثر ۸ مگابایت)
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                <img
                  src={image}
                  alt="فاکتور بارگذاری‌شده"
                  className="max-h-72 w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleScan}
                  disabled={loading}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال اسکن…
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-4 w-4" />
                      اسکن فاکتور
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={loading}>
                  تغییر تصویر
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            داده‌های استخراج‌شده
          </CardTitle>
          <CardDescription>
            اطلاعات فاکتور پس از پردازش هوش مصنوعی
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <OcrSkeleton />
          ) : !result ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Receipt className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                پس از بارگذاری تصویر و کلیک روی «اسکن»، نتایج اینجا نمایش داده
                می‌شوند.
              </p>
            </div>
          ) : (
            <InvoiceResult data={result} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OcrSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <div className="h-8 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function InvoiceResult({ data }: { data: InvoiceData }) {
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoTile
          icon={<Store className="h-4 w-4" />}
          label="فروشنده"
          value={data.seller || "—"}
        />
        <InfoTile
          icon={<Calendar className="h-4 w-4" />}
          label="تاریخ"
          value={data.date || "—"}
        />
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border scrollbar-thin">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-muted/60 text-xs">
              <tr>
                <th className="p-2 text-right font-medium whitespace-nowrap">کالا</th>
                <th className="p-2 text-center font-medium whitespace-nowrap">تعداد</th>
                <th className="p-2 text-left font-medium whitespace-nowrap">قیمت واحد</th>
                <th className="p-2 text-left font-medium whitespace-nowrap">مجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={i} className="bg-card">
                  <td className="p-2 text-right">{it.name || "—"}</td>
                  <td className="p-2 text-center">
                    {it.quantity != null
                      ? toPersianDigits(it.quantity)
                      : "—"}
                  </td>
                  <td className="p-2 text-left font-mono text-xs ltr-num">
                    {it.unitPrice != null ? formatToman(it.unitPrice) : "—"}
                  </td>
                  <td className="p-2 text-left font-mono text-xs ltr-num">
                    {it.total != null ? formatToman(it.total) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          موردی در فاکتور شناسایی نشد
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
        <span className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
          <Coins className="h-4 w-4" />
          مبلغ کل فاکتور
        </span>
        <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-200">
          {data.totalAmount != null ? formatToman(data.totalAmount) : "—"}
        </span>
      </div>

      {data.tax != null && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">مالیات</span>
          <span className="font-mono">{formatToman(data.tax)}</span>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
        onClick={() => toast.success("فاکتور آماده افزودن به سیستم است (دمو)")}
      >
        <Plus className="h-4 w-4" />
        افزودن به سیستم
      </Button>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// Tab 3: Image Recognition
// ============================================================================

function RecognizeTab() {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<RecognitionData | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("فقط فایل تصویری مجاز است");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم تصویر باید کمتر از ۸ مگابایت باشد");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImage(dataUrl);
      setResult(null);
    } catch {
      toast.error("خواندن فایل ناموفق بود");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleAnalyze() {
    if (!image) {
      toast.error("ابتدا تصویر محصول را بارگذاری کنید");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "خطا در تحلیل تصویر");
      }
      setResult(data.data as RecognitionData);
      toast.success("تحلیل محصول با موفقیت انجام شد");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطای ناشناخته";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-500" />
            تصویر محصول
          </CardTitle>
          <CardDescription>
            عکس یک محصول طلا/جواهر را بارگذاری کنید تا ویژگی‌های آن شناسایی شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onInputChange}
          />
          {!image ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={cn(
                "flex w-full min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10",
                dragOver
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                  : "border-muted-foreground/30 hover:border-amber-400 hover:bg-muted/40"
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <ImageIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="font-medium">برای انتخاب کلیک کنید</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  یا تصویر را اینجا رها کنید (حداکثر ۸ مگابایت)
                </p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl border bg-muted/30">
                <img
                  src={image}
                  alt="محصول بارگذاری‌شده"
                  className="max-h-72 w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال تحلیل…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      تحلیل محصول
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={loading}>
                  تغییر تصویر
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-amber-500" />
            ویژگی‌های شناسایی‌شده
          </CardTitle>
          <CardDescription>
            تخمین هوش مصنوعی از نوع، عیار و ارزش محصول
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <RecognizeSkeleton />
          ) : !result ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Gem className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                پس از بارگذاری تصویر و کلیک روی «تحلیل»، ویژگی‌های تخمینی اینجا
                نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <RecognitionResult data={result} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecognizeSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-16 w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

function RecognitionResult({ data }: { data: RecognitionData }) {
  const confidence = (data.confidence || "").toLowerCase();
  const confClass =
    confidence === "high"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
      : confidence === "medium"
      ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
      : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <AttrCard
          label="نوع محصول"
          value={data.type || "—"}
          icon={<Gem className="h-4 w-4" />}
        />
        <AttrCard
          label="عیار تخمینی"
          value={data.karat ? `${data.karat} عیار` : "—"}
          icon={<Coins className="h-4 w-4" />}
        />
        <AttrCard
          label="وزن تخمینی"
          value={
            data.estimatedWeight != null && data.estimatedWeight !== ""
              ? `${data.estimatedWeight} گرم`
              : "—"
          }
          icon={<ImageIcon className="h-4 w-4" />}
        />
        <AttrCard
          label="سنگ‌ها"
          value={data.stones || "—"}
          icon={<Sparkles className="h-4 w-4" />}
        />
      </div>

      <AttrCard
        label="سبک طراحی"
        value={data.style || "—"}
        icon={<Sparkles className="h-4 w-4" />}
      />

      {data.estimatedValueRange && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300">
            <Coins className="h-4 w-4" />
            بازه ارزش تخمینی
          </div>
          <p className="mt-1 text-sm font-bold text-amber-900 dark:text-amber-200">
            {data.estimatedValueRange}
          </p>
        </div>
      )}

      {data.description && (
        <div className="rounded-lg border bg-card p-3">
          <div className="text-xs text-muted-foreground">توضیح</div>
          <p className="mt-1 text-sm leading-relaxed">{data.description}</p>
        </div>
      )}

      {confidence && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">سطح اطمینان</span>
          <Badge variant="outline" className={confClass}>
            {confidence === "high"
              ? "بالا"
              : confidence === "medium"
              ? "متوسط"
              : "پایین"}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>
          این مقادیر تخمینی هستند و توسط هوش مصنوعی تولید شده‌اند. برای ارزش‌گذاری
          دقیق به کارشناس مراجعه کنید.
        </span>
      </div>
    </div>
  );
}

function AttrCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

// ============================================================================
// Tab 4: History
// ============================================================================

function HistoryTab() {
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/history", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "خطا در دریافت تاریخچه");
      }
      setItems((data.items || []) as HistoryItem[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطای ناشناخته";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              تاریخچه درخواست‌ها
            </CardTitle>
            <CardDescription className="mt-1">
              ۲۰ درخواست اخیر هوش مصنوعی شما
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <History className="h-4 w-4" />
            )}
            به‌روزرسانی
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-full animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <History className="h-10 w-10 opacity-40" />
            <p className="text-sm">هنوز درخواستی ثبت نشده است.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh] sm:max-h-[600px] pr-2">
            <div className="space-y-2">
              {items.map((it) => {
                const badge = TYPE_BADGE[it.type] || TYPE_BADGE.text_query;
                const Icon = badge.icon;
                return (
                  <div
                    key={it.id}
                    className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge
                        variant="outline"
                        className={cn(badge.cls, "gap-1")}
                      >
                        <Icon className="h-3 w-3" />
                        {it.typeLabel}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {formatPersianDateTime(it.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium">
                      {it.input}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {it.output}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
