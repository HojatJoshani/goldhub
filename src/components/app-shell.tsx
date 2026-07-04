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
  Search,
  Moon,
  Sun,
  ChevronLeft,
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
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-sidebar-border safe-top">
        <div className="flex items-center gap-3">
          <GoldHubLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-base sm:text-lg truncate">گلد هاب</h1>
            <p className="text-[10px] sm:text-xs text-sidebar-foreground/60 truncate">
              {user?.tenant?.name}
            </p>
          </div>
          {/* Close button on mobile */}
          {onNavClick && (
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden h-8 w-8 text-sidebar-foreground/60"
              onClick={onNavClick}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-0.5 sm:space-y-1 scrollbar-thin">
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
              className={`w-full flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3 py-2.5 sm:py-2.5 rounded-lg text-[13px] sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-right truncate">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <div className="p-2 sm:p-3 border-t border-sidebar-border safe-bottom">
        <div className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <AvatarFallback className="bg-amber-200 text-amber-900 text-xs sm:text-sm font-bold">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">{user?.name}</p>
            <p className="text-[10px] sm:text-xs text-sidebar-foreground/60 truncate">
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
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const currentItem = NAV_ITEMS.find((n) => n.key === current);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 fixed inset-y-0 right-0 border-l border-sidebar-border">
        <SidebarContent current={current} onNavigate={onNavigate} user={user} logout={logout} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-xs p-0">
          <SidebarContent
            current={current}
            onNavigate={onNavigate}
            user={user}
            logout={logout}
            onNavClick={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex-1 lg:mr-60 xl:mr-64 flex flex-col min-h-screen w-full">
        {/* Topbar */}
        <header className="h-14 sm:h-16 border-b bg-background/95 backdrop-blur sticky top-0 z-30 flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 safe-top">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="منو"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb - hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <span className="hidden md:inline">گلد هاب</span>
            <ChevronLeft className="hidden md:inline w-4 h-4 shrink-0" />
            <span className="font-medium text-foreground truncate">{currentItem?.label}</span>
          </div>
          {/* Mobile title */}
          <div className="flex sm:hidden items-center min-w-0 flex-1">
            <span className="font-medium text-sm truncate">{currentItem?.label}</span>
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* Search - desktop */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/60 text-sm text-muted-foreground w-48 lg:w-64">
            <Search className="w-4 h-4 shrink-0" />
            <input
              placeholder="جستجو..."
              className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground min-w-0"
            />
          </div>

          {/* Search - mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="جستجو"
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Theme toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="تغییر تم"
              className="shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="اعلان‌ها">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1 sm:px-2 shrink-0">
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
        </header>

        {/* Mobile search bar - collapsible */}
        {searchOpen && (
          <div className="md:hidden border-b px-3 py-2 bg-background animate-fade-in">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/60 text-sm">
              <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                placeholder="جستجو..."
                className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setSearchOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t py-3 sm:py-4 px-4 sm:px-6 text-center text-[11px] sm:text-xs text-muted-foreground safe-bottom">
          © {toPersianDigits(1404)} گلد هاب - پلتفرم مدیریت طلا و جواهر · نسخه ۱.۰.۰
        </footer>
      </div>
    </div>
  );
}
