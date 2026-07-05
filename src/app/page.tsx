"use client";

import * as React from "react";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { LoginPage } from "@/components/login-page";
import { AppShell } from "@/components/app-shell";
import { DashboardModule } from "@/components/modules/dashboard";
import { PosModule } from "@/components/modules/pos";
import { InventoryModule } from "@/components/modules/inventory";
import { CustomersModule } from "@/components/modules/customers";
import { OrdersModule } from "@/components/modules/orders";
import { BranchesModule } from "@/components/modules/branches";
import { AccountingModule } from "@/components/modules/accounting";
import { ReportsModule } from "@/components/modules/reports";
import { AiModule } from "@/components/modules/ai";
import { MarketplaceModule } from "@/components/modules/marketplace";
import { ToolsModule } from "@/components/modules/tools";
import { AdminModule } from "@/components/modules/admin";
import { Loader2 } from "lucide-react";
import type { ModuleKey } from "@/lib/navigation";

function AppContent() {
  const { user, loading } = useAuth();
  const [module, setModule] = React.useState<ModuleKey>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const modules: Record<ModuleKey, React.ReactNode> = {
    dashboard: <DashboardModule />,
    pos: <PosModule />,
    inventory: <InventoryModule />,
    customers: <CustomersModule />,
    orders: <OrdersModule />,
    branches: <BranchesModule />,
    accounting: <AccountingModule />,
    reports: <ReportsModule />,
    ai: <AiModule />,
    marketplace: <MarketplaceModule />,
    tools: <ToolsModule />,
    admin: <AdminModule />,
  };

  return (
    <AppShell current={module} onNavigate={setModule}>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        }
      >
        {modules[module]}
      </React.Suspense>
    </AppShell>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
