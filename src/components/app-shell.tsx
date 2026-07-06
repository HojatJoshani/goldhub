"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { NAV_ITEMS, type ModuleKey } from "@/lib/navigation";
import { GoldHubLogo } from "@/components/goldhub-logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  LogOut,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { roleLabel, toPersianDigits } from "@/lib/persian";

interface AppShellProps {
  current: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  children: React.ReactNode;
}

function SidebarContent({
  current,
  onNavigate,
  user,
  logout,
  onNavClick,
}: {
  current: ModuleKey;
  onNavigate: (k: ModuleKey) => void;
  user: ReturnType<typeof useAuth>["user"];
  logout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <div
      className="flex flex-col h-full bg-sidebar text-sidebar-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Logo - fixed height */}
      <div className="p-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <GoldHubLogo className="w-9 h-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base truncate">گلد هاب</h1>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">
              {user?.tenant?.name}
            </p>
          </div>
          {/* Close button on mobile */}
          {onNavClick && (
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden h-8 w-8 text-sidebar-foreground/60 shrink-0"
              onClick={onNavClick}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Nav - scrollable with min-h-0 for iOS */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.key);
                onNavClick?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-right truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* User card - fixed height */}
      <div className="p-2 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback className="bg-amber-200 text-amber-900 text-sm font-bold">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">
              {roleLabel(user?.role || "")}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-destructive shrink-0"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ current, onNavigate, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const currentItem = NAV_ITEMS.find((n) => n.key === current);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar - fixed */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 fixed inset-y-0 right-0 border-l border-sidebar-border z-40">
        <SidebarContent current={current} onNavigate={onNavigate} user={user} logout={logout} />
      </aside>

      {/* Mobile sidebar - Sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-[85vw] max-w-[300px] p-0 overflow-hidden"
        >
          <div className="h-full flex flex-col">
            <SidebarContent
              current={current}
              onNavigate={onNavigate}
              user={user}
              logout={logout}
              onNavClick={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="flex-1 lg:mr-60 xl:mr-64 flex flex-col min-h-screen w-full min-w-0">
        {/* Topbar - sticky with proper iOS safe area */}
        <header
          className="h-14 sm:h-16 border-b bg-background/95 backdrop-blur sticky top-0 z-50"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            marginTop: "calc(env(safe-area-inset-top) * -1)",
          }}
        >
          <div className="h-full flex items-center px-2 sm:px-4 gap-1 sm:gap-2 max-w-full">
            {/* Menu button - mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 h-10 w-10"
              onClick={() => setMobileOpen(true)}
              aria-label="منو"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Title - different on mobile vs desktop */}
            {/* Mobile: centered "گلد هاب" */}
            <div className="flex lg:hidden items-center justify-center flex-1 min-w-0">
              <span className="font-bold text-base gold-text truncate">گلد هاب</span>
            </div>

            {/* Desktop: breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span className="hidden xl:inline whitespace-nowrap">گلد هاب</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-medium text-foreground truncate max-w-[150px] xl:max-w-[200px]">{currentItem?.label}</span>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

            {/* Action buttons - always visible, compact */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {/* Theme toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  title="تغییر تم"
                  className="h-10 w-10 shrink-0"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-10 w-10 shrink-0" aria-label="اعلان‌ها">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-1 sm:px-2 shrink-0 h-10">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-amber-200 text-amber-900 text-xs font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="truncate">{user?.name}</span>
                      <span className="text-xs text-muted-foreground font-normal truncate">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 ml-2" />
                    پروفایل من
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("admin")}>
                    <Settings className="w-4 h-4 ml-2" />
                    تنظیمات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 ml-2" />
                    خروج از حساب
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content - with padding for bottom nav on mobile */}
        <main
          className="flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden"
          style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>

        {/* Footer - hidden on mobile (bottom nav replaces it) */}
        <footer className="hidden lg:block mt-auto border-t py-4 px-6 text-center text-xs text-muted-foreground">
          © {toPersianDigits(1405)} گلد هاب - پلتفرم مدیریت طلا و جواهر · نسخه ۱.۰.۰
        </footer>
      </div>

      {/* Mobile bottom navigation - fixed at bottom with safe area */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          height: "calc(3.5rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="grid grid-cols-5 h-14">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive
                    ? "text-amber-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] truncate max-w-full px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Mobile bottom nav - 5 most important modules
const MOBILE_NAV = NAV_ITEMS.filter((item) =>
  ["dashboard", "pos", "inventory", "customers", "ai"].includes(item.key)
);
