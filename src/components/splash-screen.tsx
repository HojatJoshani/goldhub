"use client";

import * as React from "react";
import { GoldHubLogo } from "@/components/goldhub-logo";

interface SplashScreenProps {
  onFinish?: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const phases = [
      "راه‌اندازی سیستم...",
      "دریافت قیمت زنده طلا...",
      "بارگذاری انبار...",
      "آماده‌سازی داشبورد...",
      "ورود به گلد هاب...",
    ];

    let currentProgress = 0;
    let currentPhase = 0;

    const interval = setInterval(() => {
      currentProgress += Math.random() * 8 + 2;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          onFinish?.();
        }, 500);
      }

      const newPhase = Math.min(
        Math.floor((currentProgress / 100) * phases.length),
        phases.length - 1
      );
      if (newPhase !== currentPhase) {
        currentPhase = newPhase;
        setPhase(newPhase);
      }

      setProgress(currentProgress);
    }, 150);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-900 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-400/20 animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, #F5D061 0%, transparent 50%), radial-gradient(circle at 70% 60%, #D4A017 0%, transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full text-center">
        {/* Animated Logo */}
        <div className="relative">
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl animate-pulse-glow" />

          {/* Rotating ring */}
          <div className="absolute inset-0 -m-4">
            <div className="w-full h-full rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin-slow" />
          </div>

          {/* Logo */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center animate-bounce-in">
            <GoldHubLogo className="w-20 h-20 sm:w-28 sm:h-28 drop-shadow-2xl" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            گلد هاب
          </h1>
          <p className="text-amber-200 text-sm sm:text-base">
            پلتفرم هوشمند مدیریت طلا و جواهر
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs space-y-3 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="h-1.5 bg-amber-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Phase text */}
          <div className="flex items-center justify-center gap-2 h-5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-amber-200/80 text-xs">
              {[
                "راه‌اندازی سیستم...",
                "دریافت قیمت زنده طلا...",
                "بارگذاری انبار...",
                "آماده‌سازی داشبورد...",
                "ورود به گلد هاب...",
              ][phase]}
            </p>
          </div>

          {/* Progress percentage */}
          <p className="text-amber-300/60 text-[10px] tabular-nums">
            {Math.round(progress)}٪
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <p className="text-amber-300/50 text-[10px] sm:text-xs">
            گروه توسعه آریا · ariadevgroup.ir
          </p>
          <p className="text-amber-300/40 text-[9px] mt-0.5">
            © ۱۴۰۵ گلد هاب - نسخه ۱.۰.۰
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-30px) translateX(20px); opacity: 0.6; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
