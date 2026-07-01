import { useState, useEffect, useRef, startTransition } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ChevronDown, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";
import { useTodayStats } from "@/hooks/use-today-stats";
import { useMarketStore, MARKET_NAMES, MarketType } from "@/lib/market-store";
import { useThemeStore } from "@/hooks/use-theme";

const MAIN_NAV_ITEMS = [
  { href: "/", label: "Home", badge: "LIVE", badgeCls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", pulse: true, statKey: null },
  { href: "/paito", label: "Paito", badge: "New", badgeCls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", statKey: null },
  { href: "/analisa-harian", label: "Analisa", badge: "📊", badgeCls: "bg-purple-500/20 text-purple-400 border border-purple-500/30", statKey: null },
  { href: "/prediksi-ai", label: "Prediksi AI", badge: "AI", badgeCls: "bg-blue-500/20 text-blue-400 border border-blue-500/30", statKey: null },
  { href: "/riwayat-prediksi", label: "Riwayat", badge: "📋", badgeCls: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30", statKey: null },
  { href: "/result", label: "Result", badge: "NEW", badgeCls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", statKey: null },
];

const PREDIKSI_NAV_ITEMS = [
  { href: "/prediksi-1d", label: "Prediksi 1D", badge: "7L", badgeCls: "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30", statKey: null },
  { href: "/prediksi-2d", label: "Prediksi 2D", badge: "70L", badgeCls: "bg-rose-500/20 text-rose-400 border border-rose-500/30", statKey: null },
  { href: "/prediksi-3d", label: "Prediksi 3D", badge: "700L", badgeCls: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30", statKey: null },
];

const STATS_NAV_ITEMS = [
  { href: "/ganjil", label: "Ganjil", badge: null, badgeCls: "bg-amber-500/20 text-amber-400 border border-amber-500/30", statKey: "ganjil" as const },
  { href: "/genap", label: "Genap", badge: null, badgeCls: "bg-sky-500/20 text-sky-400 border border-sky-500/30", statKey: "genap" as const },
  { href: "/besar", label: "Besar", badge: null, badgeCls: "bg-red-500/20 text-red-400 border border-red-500/30", statKey: "besar" as const },
  { href: "/kecil", label: "Kecil", badge: null, badgeCls: "bg-green-500/20 text-green-400 border border-green-500/30", statKey: "kecil" as const },
];

export function TopNav() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const todayStats = useTodayStats();
  const activeMarket = useMarketStore(s => s.activeMarket);
  const setMarket = useMarketStore(s => s.setMarket);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleOpen = () => setMenuOpen(true);
    document.addEventListener("open-mobile-menu", handleOpen);
    return () => document.removeEventListener("open-mobile-menu", handleOpen);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isStatsActive = STATS_NAV_ITEMS.some(item => location === item.href);

  return (
    <>
      <div ref={navRef} className="sticky top-4 z-40 mx-4 md:mx-auto max-w-6xl">
        <header className="rounded-3xl border border-primary/20 bg-background/60 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,220,255,0.1)]">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo & Market Selector */}
            <div className="flex items-center gap-2 shrink-0 relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 border border-primary/40 shadow-[0_0_15px_rgba(0,220,255,0.3)]">
                <span className="text-lg leading-none">🎰</span>
              </div>
              <div 
                className="flex flex-col leading-none cursor-pointer"
                onClick={() => setActiveDropdown(activeDropdown === 'market' ? null : 'market')}
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-foreground tracking-wide uppercase">{MARKET_NAMES[activeMarket]}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-[10px] text-primary font-bold tracking-[0.2em] mt-0.5">NEON AI</span>
              </div>
              
              {/* Market Dropdown */}
              <div className={cn("absolute top-full left-0 pt-2 z-50", activeDropdown === 'market' ? "block" : "hidden")}>
                <div className="w-48 rounded-2xl border border-primary/20 bg-background/90 p-2 backdrop-blur-2xl shadow-xl">
                  <div className="grid grid-cols-1 gap-1">
                    {(Object.keys(MARKET_NAMES) as MarketType[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          startTransition(() => setMarket(m));
                          setActiveDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 text-left",
                          activeMarket === m
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        )}
                      >
                        {MARKET_NAMES[m]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex relative">
              {/* Home */}
              <Link href={MAIN_NAV_ITEMS[0].href}>
                <button
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300",
                    location === MAIN_NAV_ITEMS[0].href
                      ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,220,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  {MAIN_NAV_ITEMS[0].label}
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="relative mr-1 flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    LIVE
                  </span>
                </button>
              </Link>

              {/* Stats Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'stats' ? null : 'stats')}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300",
                    isStatsActive
                      ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,220,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  Statistik 2D
                  <ChevronDown className={cn("h-4 w-4 transition-transform", activeDropdown === 'stats' && "rotate-180")} />
                </button>
                <div className={cn("absolute top-full left-0 pt-2 z-50", activeDropdown === 'stats' ? "block" : "hidden")}>
                  <div className="w-48 rounded-2xl border border-primary/20 bg-background/90 p-2 backdrop-blur-2xl shadow-xl">
                    <div className="grid grid-cols-1 gap-1">
                      {STATS_NAV_ITEMS.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={item.href} href={item.href}>
                            <button
                              onClick={() => setActiveDropdown(null)}
                              className={cn(
                                "w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 text-left",
                                isActive
                                  ? "bg-primary/20 text-primary"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              )}
                            >
                              {item.label}
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tracking-widest",
                                  item.badgeCls
                                )}
                              >
                                {item.statKey && todayStats
                                  ? todayStats[item.statKey]
                                  : item.badge}
                              </span>
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prediksi Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'prediksi' ? null : 'prediksi')}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300",
                    PREDIKSI_NAV_ITEMS.some(item => location === item.href)
                      ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,220,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  Formula Prediksi
                  <ChevronDown className={cn("h-4 w-4 transition-transform", activeDropdown === 'prediksi' && "rotate-180")} />
                </button>
                <div className={cn("absolute top-full left-0 pt-2 z-50", activeDropdown === 'prediksi' ? "block" : "hidden")}>
                  <div className="w-48 rounded-2xl border border-primary/20 bg-background/90 p-2 backdrop-blur-2xl shadow-xl">
                    <div className="grid grid-cols-1 gap-1">
                      {PREDIKSI_NAV_ITEMS.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={item.href} href={item.href}>
                            <button
                              onClick={() => setActiveDropdown(null)}
                              className={cn(
                                "w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300 text-left",
                                isActive
                                  ? "bg-primary/20 text-primary"
                                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              )}
                            >
                              {item.label}
                              {item.badge && (
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tracking-widest",
                                    item.badgeCls
                                  )}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Items */}
              {MAIN_NAV_ITEMS.slice(1).map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "group relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-300",
                        isActive
                          ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(0,220,255,0.2)]"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none tracking-widest",
                          item.badgeCls,
                          isActive && "shadow-[0_0_10px_currentColor]"
                        )}
                      >
                        {item.badge}
                      </span>
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle & Mobile Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(0,220,255,0.2)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Mobile/Tablet hamburger */}
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95 lg:hidden shadow-[0_0_10px_rgba(0,220,255,0.2)]"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
