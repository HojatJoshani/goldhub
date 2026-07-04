"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GoldHubLogo } from "@/components/goldhub-logo";
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand side */}
      <div className="lg:w-1/2 bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, #F5D061 0%, transparent 40%), radial-gradient(circle at 80% 70%, #D4A017 0%, transparent 40%)"
        }} />
        <div className="relative z-10 flex items-center gap-3">
          <GoldHubLogo className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold">گلد هاب</h1>
            <p className="text-amber-200 text-sm">پلتفرم هوشمند طلا و جواهر</p>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            مدیریت کامل فروشگاه طلا
            <br />
            <span className="text-amber-300">با هوش مصنوعی</span>
          </h2>
          <p className="text-amber-100 text-lg leading-relaxed">
            یک پلتفرم جامع برای مدیریت انبار، فروش، مشتریان، حسابداری و گزارش‌گیری
            فروشگاه طلا و جواهرات شما
          </p>
          <div className="grid grid-cols-1 gap-4 pt-4">
            {[
              { icon: TrendingUp, title: "داشبورد تحلیلی", desc: "نمودار فروش و سود لحظه‌ای" },
              { icon: Sparkles, title: "دستیار هوش مصنوعی", desc: "پاسخ به سوالات با زبان طبیعی" },
              { icon: ShieldCheck, title: "امنیت چندلایه", desc: "احراز هویت و کنترل دسترسی" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-amber-200 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-amber-200 text-sm">
          © {toPersianDigits(1404)} گلد هاب - تمامی حقوق محفوظ است
        </div>
      </div>

      {/* Form side */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <GoldHubLogo className="w-10 h-10" />
            <h1 className="text-2xl font-bold gold-text">گلد هاب</h1>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">ورود به حساب</CardTitle>
              <CardDescription>
                برای ادامه، ایمیل و رمز عبور خود را وارد کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-10"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">رمز عبور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 pl-10"
                      required
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input type="checkbox" className="rounded accent-amber-600" defaultChecked />
                    مرا به خاطر بسپار
                  </label>
                  <a href="#" className="text-amber-600 hover:underline">
                    رمز عبور را فراموش کرده‌اید؟
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full gold-gradient text-white font-semibold hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    "ورود به سیستم"
                  )}
                </Button>
              </form>

              <div className="mt-6 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">حساب‌های پیش‌فرض:</p>
                <p>مدیر: admin@goldhub.ir / admin123</p>
                <p>صندوق‌دار: cashier@goldhub.ir / staff123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
