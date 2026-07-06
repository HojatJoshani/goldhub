"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 p-4">
      <Card className="max-w-md w-full border-amber-200 dark:border-amber-900">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              اپلیکیشن آفلاین است
            </h1>
            <p className="text-sm text-muted-foreground">
              متأسفانه به اینترنت متصل نیستید. اپلیکیشن گلد هاب در حالت آفلاین
              کار می‌کند ولی برخی امکانات ممکن است در دسترس نباشند.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="gold-gradient text-white gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </Button>
          <div className="pt-4 border-t text-xs text-muted-foreground">
            © ۱۴۰۵ گلد هاب - گروه توسعه آریا
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
