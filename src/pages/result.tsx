import { useState, useMemo } from "react";
import { useGetTotoMonths, useGetNomorTaruhan } from "@workspace/api-client-react";
import { useMarketStore, MARKET_SESSIONS, MARKET_SESSION_LABELS } from "@/lib/market-store";
import { PageSeo } from "@/components/page-seo";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeHits } from "@/lib/classify";
import { NumberDisplay } from "@/components/number-display";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion, AnimatePresence } from "motion/react";

type DrawTimeKey = "draw0001" | "draw1300" | "draw1600" | "draw1900" | "draw2200" | "draw2300";
function drawKey(t: string): DrawTimeKey {
  return `draw${t}` as DrawTimeKey;
}

export default function ResultPage() {
  const activeMarket = useMarketStore(s => s.activeMarket);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  
  const { data: months, isLoading: monthsLoading } = useGetTotoMonths(activeMarket);
  const { data: nomorTaruhan } = useGetNomorTaruhan();

  const taruhanSet = useMemo(
    () => new Set<string>(nomorTaruhan?.numbers ?? []),
    [nomorTaruhan]
  );

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 md:pb-6">
      <PageSeo
        title="Result & Riwayat"
        description="Riwayat lengkap data keluaran Toto Macau per bulan."
      />

      <div>
        <h1 className="mb-3 text-2xl font-bold uppercase tracking-wider text-foreground">
          Riwayat per Bulan
        </h1>
        {monthsLoading ? (
          <div className="rounded-3xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50 shadow-sm">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        ) : months && months.length > 0 ? (
          <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-background overflow-hidden divide-y divide-border/50 shadow-sm backdrop-blur-xl">
            {months.map((monthGroup, idx) => {
              const key = `${monthGroup.year}-${monthGroup.month}`;
              const expanded = expandedMonths.has(key);
              return (
                <div key={key}>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/25 transition-colors"
                    onClick={() => toggleMonth(key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-2 w-2 rounded-full shrink-0",
                        idx === 0 ? "bg-primary" : "bg-border"
                      )} />
                      <span className="font-semibold text-foreground text-[15px]">
                        {monthGroup.monthName} {monthGroup.year}
                      </span>
                      <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {monthGroup.totalDays} hari
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-border/60 divide-y divide-border/30">
                      {/* Header row */}
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 sm:px-4">
                        <div className="w-[60px] shrink-0 sm:w-[90px]" />
                        {MARKET_SESSIONS[activeMarket].map((t) => (
                          <div key={t} className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                            {MARKET_SESSION_LABELS[activeMarket][t]}
                          </div>
                        ))}
                        {taruhanSet.size > 0 && (
                          <div className="w-8 shrink-0 text-center text-[9px] font-bold uppercase tracking-wider text-primary/70 sm:text-[10px]">
                            HIT
                          </div>
                        )}
                      </div>
                      {/* Data rows */}
                      <AnimatePresence>
                        {monthGroup.results.map((row, rowIdx) => {
                          const rowHits = MARKET_SESSIONS[activeMarket].reduce((sum, t) => sum + computeHits(row[drawKey(t)] ?? null, taruhanSet), 0);
                          return (
                            <motion.div 
                              key={row.drawDate}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: rowIdx * 0.05 }}
                              className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/10 transition-colors sm:px-4 sm:py-3"
                            >
                              {/* Date */}
                              <div className="w-[60px] shrink-0 sm:w-[90px]">
                              <div className="text-[9px] font-medium text-muted-foreground leading-none sm:text-[11px]">{row.dayName.slice(0,3)}</div>
                              <div className="mt-0.5 font-mono text-[11px] font-bold leading-tight text-foreground sm:text-sm">
                                {row.drawDate.slice(5).replace('-','/')}
                              </div>
                            </div>
                            {/* Draw slots */}
                            {MARKET_SESSIONS[activeMarket].map((t) => {
                              const val = row[drawKey(t)] ?? null;
                              const hits = computeHits(val, taruhanSet);
                              const isHit = taruhanSet.size > 0 && hits > 0;
                              return (
                                <div
                                  key={t}
                                  className={cn(
                                    "flex flex-1 items-center justify-center rounded-xl border py-2 text-center transition-colors sm:py-2.5",
                                    isHit
                                      ? "border-amber-500/40 bg-amber-500/15"
                                      : "border-border/30 bg-muted/20"
                                  )}
                                >
                                  <NumberDisplay
                                    value={val}
                                    className={isHit ? "text-amber-100" : undefined}
                                  />
                                </div>
                              );
                            })}
                            {/* Hit count */}
                            {taruhanSet.size > 0 && (
                              <div className="w-8 shrink-0 text-center">
                                {rowHits > 0 ? (
                                  <span className={cn(
                                    "inline-flex items-center justify-center rounded-full border font-bold h-6 w-6 text-xs",
                                    rowHits >= 16 ? "bg-green-500/35 text-green-200 border-green-500/55" :
                                    rowHits >= 8  ? "bg-orange-500/35 text-orange-200 border-orange-500/55" :
                                    rowHits >= 4  ? "bg-amber-500/35 text-amber-200 border-amber-500/55" :
                                                    "bg-amber-500/20 text-amber-300 border-amber-500/35"
                                  )}>{rowHits}</span>
                                ) : (
                                  <span className="text-muted-foreground/20 text-xs">—</span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-border/50 bg-card/60 p-10 flex flex-col items-center justify-center text-center backdrop-blur-xl">
            <SearchX className="h-10 w-10 text-muted-foreground/50 mb-4" />
            <div className="font-semibold text-foreground mb-1">Riwayat Kosong</div>
            <div className="text-sm text-muted-foreground">Belum ada data history yang tersimpan di server.</div>
          </div>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
}
