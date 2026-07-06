"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoldHubLogo } from "@/components/goldhub-logo";
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, Sparkles, TrendingUp, Crown, Zap } from "lucide-react";
import { toPersianDigits } from "@/lib/persian";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState("admin@goldhub.ir");
  const [password, setPassword] = React.useState("admin123");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "خطا در ورود");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950 dark:via-yellow-950 dark:to-amber-900 p-4 safe-top safe-bottom">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Title - Centered */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/30 mb-4 animate-bounce-in">
            <GoldHubLogo className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold gold-text mb-1">
            گلد هاب
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            پلتفرم هوشمند مدیریت طلا و جواهر
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-amber-200/50 dark:border-amber-900/50 shadow-xl shadow-amber-500/10 backdrop-blur-sm bg-white/80 dark:bg-card/80">
          <CardHeader className="text-center space-y-1 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">ورود به حساب</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              برای ادامه، ایمیل و رمز عبور خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm text-center animate-shake">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">ایمیل</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-11"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10 h-11"
                    required
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input type="checkbox" className="rounded accent-amber-600 w-4 h-4" defaultChecked />
                  مرا به خاطر بسپار
                </label>
                <a href="#" className="text-amber-600 hover:underline">
                  فراموشی رمز؟
                </a>
              </div>

              <Button
                type="submit"
                className="w-full gold-gradient text-white font-semibold hover:opacity-90 h-11 shadow-md shadow-amber-500/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ورود...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 ml-2" />
                    ورود به سیستم
                  </>
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <Crown className="w-3 h-3" />
                حساب‌های دمو:
              </p>
              <div className="grid grid-cols-1 gap-1 text-amber-700 dark:text-amber-300">
                <p>مدیر: <span dir="ltr" className="font-mono">admin@goldhub.ir</span> / <span dir="ltr" className="font-mono">admin123</span></p>
                <p>صندوق‌دار: <span dir="ltr" className="font-mono">cashier@goldhub.ir</span> / <span dir="ltr" className="font-mono">staff123</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features - Hidden on mobile to keep it clean */}
        <div className="hidden sm:grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: TrendingUp, title: "داشبورد تحلیلی", desc: "نمودار لحظه‌ای" },
            { icon: Sparkles, title: "هوش مصنوعی", desc: "پاسخ هوشمند" },
            { icon: ShieldCheck, title: "امنیت چندلایه", desc: "احراز هویت" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/60 dark:bg-card/40 backdrop-blur-sm border border-amber-200/30 dark:border-amber-900/30">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-medium text-center">{f.title}</p>
              <p className="text-[10px] text-muted-foreground text-center">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>© {toPersianDigits(1405)} گلد هاب · گروه توسعه آریا</p>
          <p className="mt-0.5">
            <a href="https://ariadevgroup.ir" className="text-amber-600 hover:underline" dir="ltr">
              ariadevgroup.ir
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
