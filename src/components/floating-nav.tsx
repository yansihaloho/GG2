import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, TrendingUp, Sparkles, Dices, Menu } from "lucide-react";
import { useTodayStats } from "@/hooks/use-today-stats";

const NAV_ITEMS = [
  { href: "/",            label: "Home",    icon: Home,        badge: "LIVE", badgeCls: "bg-emerald-500 text-white shadow-md shadow-emerald-500/50", pulse: true,  statKey: null },
  { href: "/prediksi-ai", label: "AI",      icon: Sparkles,    badge: "PRO",  badgeCls: "bg-primary text-white shadow-md shadow-primary/50",     pulse: true,  statKey: null },
  { href: "/prediksi-1d", label: "1D",      icon: Dices,       badge: "HOT",  badgeCls: "bg-blue-500 text-white shadow-md shadow-blue-500/50",    pulse: false, statKey: null },
  { href: "/ganjil",      label: "Ganjil",  icon: TrendingUp,  badge: null,   badgeCls: "bg-amber-500 text-white shadow-md shadow-amber-500/50",               statKey: "ganjil"    as const },
];

export function FloatingNav() {
  const [location] = useLocation();
  const todayStats = useTodayStats();

  const handleOpenMenu = () => {
    document.dispatchEvent(new CustomEvent("open-mobile-menu"));
  };

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="rounded-3xl border border-white/10 bg-[#0c1f2e]/90 backdrop-blur-xl shadow-2xl p-1.5 pb-2">
        <div className="grid grid-cols-5 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={cn(
                    "relative flex w-full flex-col items-center justify-center gap-1.5 px-1 py-3 transition-all duration-300 rounded-[1.25rem]",
                    isActive 
                      ? "bg-[#00e5ff]/15 text-[#00e5ff] shadow-inner border border-[#00e5ff]/20" 
                      : "text-muted-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  <span className="relative">
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] sm:h-6 sm:w-6 transition-all duration-300",
                        isActive 
                          ? "text-[#00e5ff] scale-110 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]" 
                          : "text-muted-foreground/80"
                      )}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {(item.statKey || item.badge) && (
                      <span
                        className={cn(
                          "absolute -right-3 -top-2.5 inline-flex min-w-[16px] items-center justify-center rounded-full px-[5px] py-[3px] text-[9px] font-black leading-none",
                          item.badgeCls,
                          item.pulse && "animate-pulse"
                        )}
                      >
                        {item.statKey && todayStats
                          ? todayStats[item.statKey]
                          : item.badge}
                      </span>
                    )}
                  </span>
                  
                  <span className={cn(
                    "text-[10px] font-bold leading-none tracking-wide transition-colors whitespace-nowrap mt-0.5",
                    isActive ? "text-[#00e5ff] drop-shadow-[0_0_5px_rgba(0,229,255,0.5)]" : "text-muted-foreground/70"
                  )}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
          
          {/* Lainnya Button */}
          <button
            onClick={handleOpenMenu}
            className="relative flex w-full flex-col items-center justify-center gap-1.5 px-1 py-3 transition-all duration-300 rounded-[1.25rem] text-muted-foreground hover:bg-white/5 border border-transparent"
          >
            <span className="relative">
              <Menu className="h-[22px] w-[22px] sm:h-6 sm:w-6 transition-all duration-300 text-muted-foreground/80" strokeWidth={2} />
            </span>
            <span className="text-[10px] font-bold leading-none tracking-wide transition-colors whitespace-nowrap text-muted-foreground/70 mt-0.5">
              Lainnya
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
