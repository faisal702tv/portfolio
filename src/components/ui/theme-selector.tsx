"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = [
  { id: "classic-light", name: "كلاسيكي فاتح", primary: "#AA7942", bg: "#F7F2EA", fg: "#3D2B1F" },
  { id: "classic-dark", name: "كلاسيكي داكن", primary: "#BE8F51", bg: "#1C1108", fg: "#EEE6D3" },
  { id: "premium-light", name: "بريميوم فاتح", primary: "#A06820", bg: "#F6F0E4", fg: "#1C1006" },
  { id: "premium-dark", name: "بريميوم داكن", primary: "#D4A840", bg: "#0E0B06", fg: "#EDE0C4" },
  { id: "ocean-blue", name: "أزرق المحيط", primary: "#3B82F6", bg: "#030B18", fg: "#E0EEFF" },
  { id: "emerald-green", name: "أخضر زمردي", primary: "#10B981", bg: "#030F0A", fg: "#D4F5E2" },
  { id: "midnight", name: "منتصف الليل", primary: "#6366F1", bg: "#000000", fg: "#E8E8FF" },
  { id: "royal-red", name: "أحمر ملكي", primary: "#DC2626", bg: "#0C0505", fg: "#F5E6E6" },
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="grid grid-cols-4 gap-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`relative flex flex-col items-center gap-2 rounded-xl p-3 border-2 transition-all duration-200 hover:scale-105 ${
            theme === t.id
              ? "border-primary shadow-lg ring-2 ring-primary/30"
              : "border-border hover:border-primary/50"
          }`}
          style={{ background: t.bg }}
        >
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-full" style={{ background: t.primary }} />
            <div className="w-4 h-4 rounded-full" style={{ background: t.fg, opacity: 0.6 }} />
          </div>
          <span className="text-xs font-medium" style={{ color: t.fg }}>
            {t.name}
          </span>
          {theme === t.id && (
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
