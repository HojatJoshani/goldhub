import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  ClipboardList,
  Building2,
  Calculator,
  BarChart3,
  Sparkles,
  Store,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ModuleKey =
  | "dashboard"
  | "pos"
  | "inventory"
  | "customers"
  | "orders"
  | "branches"
  | "accounting"
  | "reports"
  | "ai"
  | "marketplace"
  | "tools"
  | "admin";

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  roles?: string[]; // allowed roles
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "pos", label: "صندوق فروش (POS)", icon: ShoppingCart },
  { key: "inventory", label: "انبار", icon: Package },
  { key: "customers", label: "مشتریان", icon: Users },
  { key: "orders", label: "سفارشات و تعمیرات", icon: ClipboardList },
  { key: "branches", label: "شعبات و انبار", icon: Building2 },
  { key: "accounting", label: "حسابداری", icon: Calculator },
  { key: "reports", label: "گزارشات", icon: BarChart3 },
  { key: "tools", label: "ابزارهای طلافروشی", icon: Wrench, badge: "جدید" },
  { key: "ai", label: "دستیار هوش مصنوعی", icon: Sparkles, badge: "هوش" },
  { key: "marketplace", label: "فروشگاه آنلاین", icon: Store },
  { key: "admin", label: "مدیریت سیستم", icon: Settings },
];
