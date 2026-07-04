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

/** Audit log action labels in Persian */
export const ACTION_LABELS: Record<string, string> = {
  login: "ورود",
  logout: "خروج",
  create: "ایجاد",
  update: "ویرایش",
  delete: "حذف",
  view: "مشاهده",
  export: "خروجی",
  import: "ورودی",
  print: "چاپ",
  status_change: "تغییر وضعیت",
  open: "باز کردن",
  close: "بستن",
  transfer: "انتقال",
  adjust: "تعدیل",
  deactivate: "غیرفعال‌سازی",
  activate: "فعال‌سازی",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}

/** Audit log entity labels in Persian */
export const ENTITY_LABELS: Record<string, string> = {
  User: "کاربر",
  Product: "محصول",
  Customer: "مشتری",
  Sale: "فروش",
  Order: "سفارش",
  CustomOrder: "سفارش سفارشی",
  Branch: "شعبه",
  Category: "دسته‌بندی",
  Expense: "هزینه",
  Cashbox: "صندوق",
  Invoice: "فاکتور",
  Transfer: "انتقال",
  StockMovement: "حرکت انبار",
  Tenant: "سازمان",
  GoldPrice: "قیمت طلا",
  Alert: "هشدار",
  Notification: "اعلان",
  Supplier: "تأمین‌کننده",
  AIQuery: "پرسش هوش مصنوعی",
};

export function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] || entity;
}

/** Payment method labels */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدی",
  card: "کارتی",
  transfer: "انتقال بانکی",
  gold: "طلا",
  mixed: "ترکیبی",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}

/** Order type labels */
export const ORDER_TYPE_LABELS: Record<string, string> = {
  custom: "سفارشی",
  repair: "تعمیر",
  manufacturing: "ساخت",
};

export function orderTypeLabel(type: string): string {
  return ORDER_TYPE_LABELS[type] || type;
}

/** Stock movement type labels */
export const STOCK_MOVE_LABELS: Record<string, string> = {
  purchase: "خرید",
  sale: "فروش",
  transfer_in: "ورود از انتقال",
  transfer_out: "خروج به انتقال",
  adjustment: "تعدیل",
  return: "مرجوعی",
};

export function stockMoveLabel(type: string): string {
  return STOCK_MOVE_LABELS[type] || type;
}

/** Expense category labels */
export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  rent: "اجاره",
  salary: "حقوق",
  utilities: "قبوض",
  supplies: "تجهیزات",
  marketing: "تبلیغات",
  other: "سایر",
};

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABELS[category] || category;
}

/** Branch type labels */
export function branchTypeLabel(branch: { isWarehouse?: boolean; isMain?: boolean }): string {
  if (branch?.isWarehouse) return "انبار";
  if (branch?.isMain) return "شعبه اصلی";
  return "شعبه";
}

/** Customer loyalty tier labels */
export function loyaltyTierLabel(points: number): string {
  if (points >= 2000) return "پلاتین";
  if (points >= 1000) return "طلایی";
  if (points >= 500) return "نقره‌ای";
  if (points >= 100) return "برنزی";
  return "عادی";
}
