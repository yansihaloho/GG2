import { Link } from "wouter";
import {
  useMarketStore,
  MARKET_NAMES,
  MARKET_SESSIONS,
  MARKET_SESSION_LABELS,
} from "@/lib/market-store";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTotoLatest,
  useGetTotoMonths,
  useGetTotoSchedule,
  useRefreshTotoData,
  getGetTotoMonthsQueryKey,
  getGetTotoLatestQueryKey,
  getGetTotoScheduleQueryKey,
  useGetSyncStatus,
  getGetSyncStatusQueryKey,
  useGetTotoVerify,
  useRepairTotoData,
  getGetTotoVerifyQueryKey,
} from "@workspace/api-client-react";
import { PageSeo } from "@/components/page-seo";
import { PageSkeleton } from "@/components/page-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Timer,
  Database,
  Globe,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  Sparkles,
  SearchX,
  Dices,
  Target,
  BarChart3,
  History,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useCountdown } from "@/hooks/use-countdown";
import {
  NumberDisplayBadged,
  NumberDisplay,
} from "@/components/number-display";
import { useGetNomorTaruhan } from "@workspace/api-client-react";
import { computeHits } from "@/lib/classify";
import { useToast } from "@/hooks/use-toast";
import { ScrollToTop } from "@/components/scroll-to-top";
import { motion, AnimatePresence } from "motion/react";

type DrawTimeKey =
  "draw0001" | "draw1300" | "draw1600" | "draw1900" | "draw2200" | "draw2300";
function drawKey(t: string): DrawTimeKey {
  return `draw${t}` as DrawTimeKey;
}

export default function Home() {
  const activeMarket = useMarketStore((s) => s.activeMarket);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const {
    isActive: autoActive,
    lastRefreshed,
    nextDrawLabel,
  } = useAutoRefresh(activeMarket);
  const countdown = useCountdown(activeMarket);

  const { data: latest, isLoading: latestLoading } =
    useGetTotoLatest(activeMarket);
  const { data: months, isLoading: monthsLoading } =
    useGetTotoMonths(activeMarket);
  const { data: schedule } = useGetTotoSchedule(activeMarket);
  const { data: nomorTaruhan } = useGetNomorTaruhan();
  const { data: syncStatus } = useGetSyncStatus();
  const { data: verifyReport, isLoading: verifyLoading } = useGetTotoVerify();

  const refreshMutation = useRefreshTotoData();
  const repairMutation = useRepairTotoData();

  const taruhanSet = useMemo(
    () => new Set<string>(nomorTaruhan?.numbers ?? []),
    [nomorTaruhan],
  );

  // Audio countdown effect
  useEffect(() => {
    const playBeep = (freq = 880, duration = 0.5) => {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.00001,
          ctx.currentTime + duration,
        );
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (err) {
        // ignore
      }
    };

    if (countdown.totalSeconds === 0) {
      // Final long beep
      playBeep(440, 1.5);
    } else if (countdown.totalSeconds <= 5 && countdown.totalSeconds > 0) {
      // Short beep for last 5 seconds
      playBeep(880, 0.2);
    }
  }, [countdown.totalSeconds]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync();
      await queryClient.invalidateQueries({
        queryKey: getGetTotoMonthsQueryKey(activeMarket),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetTotoLatestQueryKey(activeMarket),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetTotoScheduleQueryKey(activeMarket),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetSyncStatusQueryKey(),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetTotoVerifyQueryKey(),
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRepair() {
    setRepairing(true);
    try {
      const result = await repairMutation.mutateAsync();
      toast({
        title: "Integrasi Data Sukses!",
        description: `Berhasil memperbaiki ${result.repairedCount} draw kosong di masa lalu dengan hasil draw simulasi presisi tinggi.`,
      });
      // Invalidate queries to refresh calculations
      await queryClient.invalidateQueries({
        queryKey: getGetTotoMonthsQueryKey(activeMarket),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetTotoLatestQueryKey(activeMarket),
      });
      await queryClient.invalidateQueries({
        queryKey: getGetTotoVerifyQueryKey(),
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal memulihkan data",
        description:
          err.message || "Terjadi kendala jaringan atau kesalahan internal.",
      });
    } finally {
      setRepairing(false);
    }
  }

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (latestLoading || monthsLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 pt-6 md:pb-6">
        <PageSeo
          title="Home"
          description="Data result Toto Macau live terlengkap. Cek hasil keluaran terbaru."
        />
        <PageSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 pt-6 md:pb-6">
      <PageSeo
        title="Home"
        description="Data result Toto Macau live terlengkap. Cek hasil keluaran terbaru."
      />

      {/* Header & Market Selector */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                {MARKET_NAMES[activeMarket]}
              </h1>
              {autoActive && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-500 border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {autoActive
                ? "Auto-refresh aktif setiap 30 detik"
                : lastRefreshed
                  ? `Diperbarui ${lastRefreshed.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · Draw berikutnya ${nextDrawLabel} WIB`
                  : `Data hasil keluaran lengkap · Draw berikutnya ${nextDrawLabel} WIB`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center p-1 bg-muted/40 backdrop-blur-md rounded-full border border-border/50">
              {(
                Object.entries(MARKET_NAMES) as [
                  keyof typeof MARKET_NAMES,
                  string,
                ][]
              ).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => useMarketStore.getState().setMarket(key)}
                  className={cn(
                    "px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full transition-all duration-300",
                    activeMarket === key
                      ? "bg-background text-foreground shadow-sm shadow-black/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full shrink-0 border-border/50 bg-muted/40 backdrop-blur-md hover:bg-background h-10 w-10 shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  refreshing && "animate-spin text-primary",
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hero (Countdown) + Latest Results */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Countdown Timer */}
          <div
            className={cn(
              "rounded-3xl border p-6 sm:p-10 transition-all duration-500 relative overflow-hidden backdrop-blur-xl flex flex-col justify-center",
              countdown.isImminent
                ? "border-primary/50 bg-primary/10 shadow-[0_0_40px_rgba(var(--primary),0.2)]"
                : "border-border/50 bg-gradient-to-br from-card/80 to-card/40 shadow-2xl",
            )}
          >
            {/* Glow orb background */}
            <div
              className={cn(
                "absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000",
                countdown.isImminent
                  ? "bg-primary/40 animate-pulse"
                  : "bg-primary/20",
              )}
            />
            <div
              className={cn(
                "absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full blur-[100px] pointer-events-none transition-all duration-1000",
                countdown.isImminent
                  ? "bg-secondary/30 animate-pulse"
                  : "bg-primary/10",
              )}
            />

            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="flex items-center gap-5 flex-wrap">
                <div
                  className={cn(
                    "flex items-center justify-center h-16 w-16 rounded-3xl border transition-all duration-500 backdrop-blur-md",
                    countdown.isImminent
                      ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                      : "bg-background/50 border-border/50 text-muted-foreground shadow-inner",
                  )}
                >
                  <Timer
                    className={cn(
                      "h-8 w-8",
                      countdown.isImminent && "animate-pulse",
                    )}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 mb-1">
                    Draw berikutnya
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "font-black text-3xl tracking-wide",
                        countdown.isImminent
                          ? "text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]"
                          : "text-foreground",
                      )}
                    >
                      {countdown.nextDrawLabel} WIB
                    </span>
                    {countdown.isImminent && (
                      <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-black text-primary border border-primary/40 animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.4)]">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                        </span>
                        SEGERA
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-5 bg-background/40 backdrop-blur-md p-5 rounded-3xl border border-border/50 shadow-inner">
                {[
                  { value: countdown.hours, label: "JAM" },
                  { value: countdown.minutes, label: "MNT" },
                  { value: countdown.seconds, label: "DTK" },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-3 sm:gap-5">
                    {i > 0 && (
                      <span
                        className={cn(
                          "text-3xl font-black tabular-nums -mt-6",
                          countdown.isImminent
                            ? "text-primary/70 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                            : "text-muted-foreground/40",
                        )}
                      >
                        :
                      </span>
                    )}
                    <div className="flex flex-col items-center gap-2.5">
                      <span
                        className={cn(
                          "min-w-[4.5rem] rounded-2xl px-2 py-4 text-center text-4xl sm:text-5xl font-black tabular-nums leading-none tracking-tighter transition-all duration-300",
                          countdown.isImminent
                            ? "bg-primary/20 text-primary border border-primary/40 shadow-[inset_0_0_20px_rgba(var(--primary),0.2),0_0_20px_rgba(var(--primary),0.3)]"
                            : "text-foreground drop-shadow-md bg-background/50 border border-border/30",
                        )}
                      >
                        {String(value).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-black tracking-[0.2em] uppercase",
                          countdown.isImminent
                            ? "text-primary"
                            : "text-muted-foreground/80",
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Draw schedule chips */}
            {schedule && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border/40 pt-6">
                <Clock className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">
                  Jadwal Result:
                </span>
                {schedule.drawTimes.map((t) => (
                  <Badge
                    key={t}
                    variant={
                      t === countdown.nextDrawLabel ? "default" : "secondary"
                    }
                    className={cn(
                      "font-mono text-xs rounded-lg px-3 py-1.5 transition-colors",
                      t === countdown.nextDrawLabel
                        ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
                        : "bg-background/50 hover:bg-muted text-muted-foreground border-border/50",
                    )}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Latest Result */}
          <div className="flex-1">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Hasil Terbaru
            </h2>
            {latestLoading ? (
              <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-background overflow-hidden backdrop-blur-xl h-[180px] flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/50" />
              </div>
            ) : latest ? (
              <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/5 to-card overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                {/* Day header */}
                <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 px-5 py-4">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-bold text-foreground text-sm sm:text-base">
                    {latest.dayName}, {latest.drawDate}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 border border-green-500/30 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    LIVE
                  </span>
                </div>
                {/* Results grid */}
                <div
                  className={cn(
                    "grid divide-x divide-y sm:divide-y-0 divide-border/30 bg-card/50",
                    MARKET_SESSIONS[activeMarket].length === 1
                      ? "grid-cols-1"
                      : "grid-cols-3 sm:grid-cols-6",
                  )}
                >
                  {MARKET_SESSIONS[activeMarket].map((t, i) => {
                    const val = latest[drawKey(t)] ?? null;
                    const hasResult = !!val;
                    return (
                      <div
                        key={t}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 px-3 py-6 text-center transition-colors hover:bg-muted/10",
                          i < 3 && "border-b sm:border-b-0", // handle mobile grid borders
                          hasResult ? "" : "opacity-60",
                        )}
                      >
                        <div className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                          {MARKET_SESSION_LABELS[activeMarket][t]}
                        </div>
                        <NumberDisplayBadged
                          value={val}
                          className="scale-110 origin-center"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-border/50 bg-card/60 p-10 flex flex-col items-center justify-center text-center backdrop-blur-xl">
                <SearchX className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <div className="font-semibold text-foreground mb-1">
                  Belum ada data terbaru
                </div>
                <div className="text-sm text-muted-foreground">
                  Klik Refresh untuk mengambil data hasil draw hari ini.
                </div>
              </div>
            )}
          </div>

          {/* Akses Cepat / Menu Utama */}
          <div className="mt-2">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Menu Utama
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <Link
                href="/prediksi-ai"
                className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#0f111a] hover:bg-[#141724] transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#0c1f2e] text-[#00e5ff] shadow-inner border border-white/5 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
                  <Sparkles
                    className="h-10 w-10 drop-shadow-[0_0_15px_rgba(0,229,255,0.6)]"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base sm:text-lg mb-1 tracking-tight">
                    Prediksi AI
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Cerdas & Akurat
                  </div>
                </div>
              </Link>

              <Link
                href="/prediksi-1d"
                className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#0f111a] hover:bg-[#141724] transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#0f1b33] text-[#3b82f6] shadow-inner border border-white/5 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                  <Dices
                    className="h-10 w-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base sm:text-lg mb-1 tracking-tight">
                    Prediksi 1D
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Colok Bebas
                  </div>
                </div>
              </Link>

              <Link
                href="/prediksi-2d"
                className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#0f111a] hover:bg-[#141724] transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#1a102e] text-[#a855f7] shadow-inner border border-white/5 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3">
                  <Target
                    className="h-10 w-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base sm:text-lg mb-1 tracking-tight">
                    Prediksi 2D
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Angka Jitu 2D
                  </div>
                </div>
              </Link>

              <Link
                href="/prediksi-3d"
                className="group flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-white/5 bg-[#0f111a] hover:bg-[#141724] transition-all duration-300 shadow-lg hover:shadow-2xl"
              >
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[#2a0a15] text-[#f43f5e] shadow-inner border border-white/5 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                  <Zap
                    className="h-10 w-10 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-base sm:text-lg mb-1 tracking-tight">
                    Prediksi 3D/4D
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Tembus Besar
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Status Widgets */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-2 lg:mt-0 mb-[-12px]">
            Sistem Informasi
          </h2>

          {/* Sync Status Widget */}
          {syncStatus && (
            <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 p-6 shadow-xl backdrop-blur-xl flex flex-col gap-5 relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 blur-[40px] pointer-events-none" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 shadow-inner border border-emerald-500/20">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">
                    Sumber Data Live
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5 text-emerald-400/80">
                    masterlive.net
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-border/40" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 shadow-inner border border-indigo-500/20">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">
                    Riwayat Tersimpan
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {syncStatus.lastSyncCount} Hari (2026)
                  </div>
                </div>
              </div>

              <div className="h-[1px] w-full bg-border/40" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 shadow-inner border border-amber-500/20">
                  <Activity
                    className={cn(
                      "h-6 w-6",
                      syncStatus.lastSyncStatus === "PENDING"
                        ? "animate-spin text-amber-400"
                        : "animate-pulse",
                    )}
                  />
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">
                    Sinkronisasi Terakhir
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-1">
                    {syncStatus.lastSyncStatus === "SUCCESS" ? (
                      <span className="text-foreground/80">
                        Sukses ·{" "}
                        {new Date(syncStatus.lastSyncTime).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        WIB
                      </span>
                    ) : syncStatus.lastSyncStatus === "PENDING" ? (
                      <span className="text-amber-400 animate-pulse font-semibold">
                        Sedang sinkronisasi...
                      </span>
                    ) : (
                      <span className="text-red-400 font-semibold">
                        Gagal (Mencoba kembali...)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification & Integrity Panel */}
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 to-card/40 p-6 shadow-xl backdrop-blur-xl flex flex-col gap-5 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute bottom-0 left-0 h-32 w-32 bg-emerald-500/5 blur-[40px] pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner border",
                  verifyLoading
                    ? "bg-muted text-muted-foreground animate-pulse border-border"
                    : verifyReport && verifyReport.healthScore === 100
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/20",
                )}
              >
                {verifyLoading ? (
                  <RefreshCw className="h-6 w-6 animate-spin" />
                ) : verifyReport && verifyReport.healthScore === 100 ? (
                  <ShieldCheck className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-foreground text-sm">
                    Validasi Integritas
                  </h3>
                  {verifyLoading ? (
                    <Badge
                      variant="secondary"
                      className="animate-pulse text-[10px]"
                    >
                      Cek...
                    </Badge>
                  ) : verifyReport ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold font-mono px-2 py-0 text-[10px] uppercase",
                        verifyReport.healthScore === 100
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30",
                      )}
                    >
                      {verifyReport.healthScore}% OK
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {verifyLoading
                    ? "Menganalisis dataset riwayat..."
                    : verifyReport
                      ? verifyReport.healthScore === 100
                        ? "Data utuh dan terverifikasi sempurna. Tidak ada draw kosong."
                        : `Ditemukan ${verifyReport.anomalies.filter((a) => !a.repaired).length} masalah pada dataset.`
                      : "Gagal memuat status."}
                </p>
              </div>
            </div>

            {/* Actions for Verification */}
            {!verifyLoading &&
              verifyReport &&
              verifyReport.healthScore < 100 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="default"
                    onClick={handleRepair}
                    disabled={repairing}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white gap-2 font-semibold shadow-lg shadow-rose-500/20"
                  >
                    <Wrench
                      className={cn("h-4 w-4", repairing && "animate-spin")}
                    />
                    {repairing ? "Memperbaiki..." : "Auto-Repair Dataset"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowIssues(!showIssues)}
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showIssues
                      ? "Sembunyikan Masalah"
                      : "Lihat Detail Masalah"}
                  </Button>
                </div>
              )}

            {!verifyLoading &&
              verifyReport &&
              verifyReport.healthScore === 100 && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-500/20">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  SIAP DIGUNAKAN UNTUK PREDIKSI AI
                </div>
              )}

            {/* Collapsible Issues List */}
            {showIssues &&
              verifyReport &&
              verifyReport.anomalies.length > 0 && (
                <div className="mt-2 space-y-2 border-t border-border/50 pt-4">
                  <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                    {verifyReport.anomalies.map((anomaly, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl bg-background/50 p-3 text-xs border border-border/40 shadow-sm"
                      >
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground mb-0.5">
                            {anomaly.date}{" "}
                            <span className="text-muted-foreground font-normal">
                              (Sesi {anomaly.session})
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[11px] leading-relaxed">
                            {anomaly.message}
                          </div>
                        </div>
                        {anomaly.repaired ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                            OK
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]"
                          >
                            ERR
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
}
