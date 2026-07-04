// Persian utility functions

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Convert English digits to Persian */
export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Convert Persian digits to English */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

/** Format number with thousands separator (Persian) */
export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || isNaN(value)) return "۰";
  const formatted = new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
  return formatted;
}

/** Format currency in Tomans */
export function formatToman(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "۰ تومان";
  return `${formatNumber(Math.round(value))} تومان`;
}

/** Format currency in Rial */
export function formatRial(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "۰ ریال";
  return `${formatNumber(Math.round(value))} ریال`;
}

/** Format weight in grams */
export function formatWeight(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "۰ گرم";
  return `${formatNumber(value, 3)} گرم`;
}

/** Format date to Persian (Jalali) */
export function formatPersianDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/** Format date and time to Persian */
export function formatPersianDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/** Get relative time in Persian */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "هم‌اکنون";
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  if (diffHour < 24) return `${toPersianDigits(diffHour)} ساعت پیش`;
  if (diffDay < 30) return `${toPersianDigits(diffDay)} روز پیش`;
  return formatPersianDate(d);
}

/** Karat labels in Persian */
export const KARAT_LABELS: Record<string, string> = {
  "999": "۲۴ عیار",
  "916": "۲۲ عیار",
  "750": "۱۸ عیار",
  "585": "۱۴ عیار",
  "417": "۱۰ عیار",
  "375": "۹ عیار",
};

export function karatLabel(karat: string): string {
  return KARAT_LABELS[karat] || `${toPersianDigits(karat)} عیار`;
}

/** Translate status to Persian */
export const STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  pending: "در انتظار",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
  paid: "پرداخت شده",
  unpaid: "پرداخت نشده",
  partial: "پرداخت جزئی",
  open: "باز",
  closed: "بسته",
  issued: "صادر شده",
  refunded: "مرجوع شده",
  void: "باطل",
  received: "دریافت شده",
  in_transit: "در حال انتقال",
  design: "طراحی",
  manufacturing: "ساخت",
  polishing: "پرداخت",
  ready: "آماده تحویل",
  delivered: "تحویل شده",
  starter: "مبتدی",
  pro: "حرفه‌ای",
  enterprise: "سازمانی",
  suspended: "معلق",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/** Role labels in Persian */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدیر ارشد",
  admin: "مدیر",
  manager: "مدیر شعبه",
  cashier: "صندوق‌دار",
  staff: "کارمند",
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}
