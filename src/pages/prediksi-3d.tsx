import { useMarketStore, MARKET_NAMES, MARKET_SESSIONS, MARKET_SESSION_LABELS } from "@/lib/market-store";
import { useGetTotoMonths } from "@workspace/api-client-react";
import { PageSeo } from "@/components/page-seo";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/page-skeleton";
import { cn, getDefaultSession } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import {
  Copy, Check, Sparkles, Cpu, Layers2, TrendingUp, HelpCircle,
  TrendingDown, AlertTriangle, ArrowRight, Play, Eye, EyeOff
} from "lucide-react";




import type { DrawTime } from "@/lib/prediction-engine";

interface LineResult {
  num: string; // "000" - "999"
  score: number;
  freq: number;
  gap: number;
  decayScore: number;
  comboScore: number;
  transitionScore: number;
  rank: number;
}

export default function Prediksi3DPage() {
  const activeMarket = useMarketStore(s => s.activeMarket);
  const { data: months, isLoading } = useGetTotoMonths(activeMarket);
  const [selectedSession, setSelectedSession] = useState<DrawTime>(() => getDefaultSession(activeMarket) as DrawTime);

  useEffect(() => {
    setSelectedSession(getDefaultSession(activeMarket) as DrawTime);
  }, [activeMarket]);

  const separator = "*";
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [showWeakLines, setShowWeakLines] = useState(false);

  // Parse all drawings from history
  const allResults = useMemo(() => {
    if (!months) return [];
    const list: { drawDate: string; session: string; result: string }[] = [];
    months.forEach((m) => {
      m.results.forEach((day) => {
        MARKET_SESSIONS[activeMarket].forEach((t) => {
          const val = day[`draw${t}` as const];
          if (val && val.length === 4 && !isNaN(parseInt(val))) {
            list.push({
              drawDate: day.drawDate,
              session: t,
              result: val,
            });
          }
        });
      });
    });
    // Sort from oldest to newest
    return list.sort((a, b) => a.drawDate.localeCompare(b.drawDate));
  }, [months]);

  // Filter based on chosen session
  const filteredResults = useMemo(() => {
    if (selectedSession === "all") return allResults;
    return allResults.filter((r) => r.session === selectedSession);
  }, [allResults, selectedSession]);

  // Main calculation of 1000 possible 3D lines
  const predictionList = useMemo<LineResult[]>(() => {
    if (filteredResults.length === 0) return [];

    const totalDraws = filteredResults.length;
    const freq3D = new Array(1000).fill(0);
    const lastSeenIndex = new Array(1000).fill(-1);

    // Individual position frequencies
    const freqKop = new Array(10).fill(0);
    const freqKepala = new Array(10).fill(0);
    const freqEkor = new Array(10).fill(0);

    // Exponentially decay-weighted frequency
    const decay3D = new Array(1000).fill(0);

    // Transition count: from previous draw 3D to next 3D
    const transitionMatrix: Record<string, number[]> = {};

    filteredResults.forEach((draw, idx) => {
      const full4d = draw.result;
      const kopDigit = parseInt(full4d[1]);
      const kepDigit = parseInt(full4d[2]);
      const ekorDigit = parseInt(full4d[3]);
      const val3d = kopDigit * 100 + kepDigit * 10 + ekorDigit;
      const val3dStr = full4d.substring(1);

      freq3D[val3d]++;
      lastSeenIndex[val3d] = idx;

      freqKop[kopDigit]++;
      freqKepala[kepDigit]++;
      freqEkor[ekorDigit]++;

      // Decay scoring (recent draws get higher weight)
      decay3D[val3d] += Math.pow(0.965, totalDraws - 1 - idx);

      // Transition matrix tracking
      if (idx > 0) {
        const prevFull = filteredResults[idx - 1].result;
        const prevVal3dStr = prevFull.substring(1);
        if (!transitionMatrix[prevVal3dStr]) {
          transitionMatrix[prevVal3dStr] = new Array(1000).fill(0);
        }
        transitionMatrix[prevVal3dStr][val3d]++;
      }
    });

    // Last drawn 3D for Markov chain transition
    const lastDraw = filteredResults[filteredResults.length - 1]?.result;
    const last3dStr = lastDraw ? lastDraw.substring(1) : "";
    const transitionWeights = transitionMatrix[last3dStr] || new Array(1000).fill(0);
    const maxTransition = Math.max(1, ...transitionWeights);

    // Build scores for each of 1000 combinations
    const results: LineResult[] = Array.from({ length: 1000 }, (_, i) => {
      const numStr = i.toString().padStart(3, "0");
      const kop = Math.floor(i / 100);
      const kep = Math.floor((i % 100) / 10);
      const ekor = i % 10;

      const count = freq3D[i];
      const gap = lastSeenIndex[i] === -1 ? totalDraws : totalDraws - 1 - lastSeenIndex[i];

      // Normalized sub-scores
      const fScore = (count / Math.max(1, Math.max(...freq3D))) * 100;
      const dScore = (decay3D[i] / Math.max(0.001, Math.max(...decay3D))) * 100;
      const cScore = ((freqKop[kop] + freqKepala[kep] + freqEkor[ekor]) / Math.max(1, Math.max(...freqKop) + Math.max(...freqKepala) + Math.max(...freqEkor))) * 100;
      const tScore = (transitionWeights[i] / maxTransition) * 100;

      // Gap bonus: we prefer hot numbers but also include a "rebound overdue" factor
      const gapBonus = Math.min(60, gap * 1.5);

      // Final mathematical composite score
      // Weighting: Trend (30%) + All-Time Freq (20%) + Transition Trend (15%) + Position Strength (20%) + Overdue Gap Factor (15%)
      const totalScore = (dScore * 0.3) + (fScore * 0.2) + (tScore * 0.15) + (cScore * 0.2) + (gapBonus * 0.15);

      return {
        num: numStr,
        score: Math.round(totalScore),
        freq: count,
        gap,
        decayScore: Math.round(dScore),
        comboScore: Math.round(cScore),
        transitionScore: Math.round(tScore),
        rank: 0, // Assigned below
      };
    });

    // Sort by composite score descending
    results.sort((a, b) => b.score - a.score || b.freq - a.freq || a.gap - b.gap);

    // Assign rank
    results.forEach((item, index) => {
      item.rank = index + 1;
    });

    return results;
  }, [filteredResults]);

  // Segregate the 1000 lines into groups for 700 line targeting
  const lineUtama = useMemo(() => predictionList.slice(0, 100), [predictionList]);
  const lineCadangan = useMemo(() => predictionList.slice(100, 400), [predictionList]);
  const lineSupport = useMemo(() => predictionList.slice(400, 700), [predictionList]);
  const lineLemah = useMemo(() => predictionList.slice(700, 1000), [predictionList]);

  const all700Lines = useMemo(() => {
    return [...lineUtama, ...lineCadangan, ...lineSupport].map(x => x.num).sort();
  }, [lineUtama, lineCadangan, lineSupport]);

  // Backtest simulation: calculates what percentage of previous K draws were "Hits" in our 700-line generator
  const backtestStats = useMemo(() => {
    if (allResults.length < 25) return { rate: 0, hits: 0, total: 0 };

    const K = Math.min(30, allResults.length - 20); // Test last 30 draws
    let hits = 0;

    for (let i = 0; i < K; i++) {
      const testIdx = allResults.length - 1 - i;
      const testDraw = allResults[testIdx];
      const testDraw3D = testDraw.result.substring(1);

      // Compile prediction prior to testIdx
      const priorHistory = allResults.slice(0, testIdx);
      if (selectedSession !== "all") {
        // filter session
        const sessHistory = priorHistory.filter(h => h.session === testDraw.session);
        if (sessHistory.length < 10) continue;
      }

      // Re-run simplified prediction calculation
      const tempFreq = new Array(1000).fill(0);
      const tempDecay = new Array(1000).fill(0);
      const tempKop = new Array(10).fill(0);
      const tempKepala = new Array(10).fill(0);
      const tempEkor = new Array(10).fill(0);
      const histLength = priorHistory.length;

      priorHistory.forEach((h, idx) => {
        const full4d = h.result;
        const kop = parseInt(full4d[1]);
        const kep = parseInt(full4d[2]);
        const ek = parseInt(full4d[3]);
        const val = kop * 100 + kep * 10 + ek;

        tempFreq[val]++;
        tempDecay[val] += Math.pow(0.965, histLength - 1 - idx);
        tempKop[kop]++;
        tempKepala[kep]++;
        tempEkor[ek]++;
      });

      const tempScores = Array.from({ length: 1000 }, (_, code) => {
        const kop = Math.floor(code / 100);
        const kep = Math.floor((code % 100) / 10);
        const ek = code % 10;
        const fScore = (tempFreq[code] / Math.max(1, Math.max(...tempFreq))) * 100;
        const dScore = (tempDecay[code] / Math.max(0.001, Math.max(...tempDecay))) * 100;
        const cScore = ((tempKop[kop] + tempKepala[kep] + tempEkor[ek]) / Math.max(1, Math.max(...tempKop) + Math.max(...tempKepala) + Math.max(...tempEkor))) * 100;

        return { code, score: dScore * 0.4 + fScore * 0.3 + cScore * 0.3 };
      });

      tempScores.sort((a, b) => b.score - a.score);
      const top700Codes = tempScores.slice(0, 700).map(x => x.code.toString().padStart(3, "0"));

      if (top700Codes.includes(testDraw3D)) {
        hits++;
      }
    }

    const rate = (hits / K) * 100;
    return {
      rate: Math.round(rate),
      hits,
      total: K,
    };
  }, [allResults, selectedSession]);

  function copyText(nums: string[], groupName: string) {
    const text = nums.join(separator);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedGroup(groupName);
      setTimeout(() => setCopiedGroup(null), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 md:pb-6">
      <PageSeo
        title="Prediksi 3D Belakang 700 Line"
        description={`Analisis multi-algoritma data historis ${MARKET_NAMES[activeMarket]} untuk menghasilkan 700 line 3D belakang paling akurat.`}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/25">
              <Layers2 className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground">AI Prediksi 3D Belakang</h1>
              <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-bold py-0.5 px-2 mt-0.5">
                Formula 700 Line Terkuat
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground ml-14 pl-0.5">
            Menghitung probabilitas kombinasi 3 Angka Belakang (000–999) menggunakan Frequency, Exponential Trend, Markov Chain, dan Overdue Gap.
          </p>
        </div>

        {/* Backtest accuracy badge */}
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-3 sm:w-auto">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground leading-none">Akurasi 30 Result Terakhir</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-400">{backtestStats.rate}%</span>
              <span className="text-[10px] text-muted-foreground">Hit Rate ({backtestStats.hits}/{backtestStats.total} Draw)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel / Session Selection */}
      <div className="grid grid-cols-1 gap-4">
        {/* Session card filter */}
        <div className="rounded-2xl border border-border bg-card/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest block">
              PILIH SESI DRAW MACAU
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MARKET_SESSIONS[activeMarket].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedSession(t)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-bold transition-all border shrink-0",
                  selectedSession === t
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/40 shadow-sm"
                    : "bg-muted/20 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40"
                )}
              >
                Sesi {MARKET_SESSION_LABELS[activeMarket][t]} WIB
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton type="prediction" />
      ) : predictionList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground shadow-sm backdrop-blur-xl">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500/80 mb-2" />
          Data historis kosong atau tidak ditemukan.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main 700 Line Hub Card */}
          <div className="rounded-3xl border border-primary/20 bg-background/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,220,255,0.1)] overflow-hidden">
            {/* Header copy action */}
            <div className="border-b border-primary/20 bg-primary/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest drop-shadow-[0_0_5px_currentColor]">Gabungan 700 Line Terkuat</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gabungan Utama + Cadangan + Support</p>
                </div>
              </div>
              <button
                onClick={() => copyText(all700Lines, "all700")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition-all border",
                  copiedGroup === "all700"
                    ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                    : "bg-indigo-500 text-white border-transparent hover:bg-indigo-600 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                )}
              >
                {copiedGroup === "all700" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedGroup === "all700" ? "Berhasil Disalin!" : "Copy Semua 700 Line"}
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-black/30 relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,220,255,0.05),transparent_70%)] pointer-events-none" />
              
              {/* Fast code text display for copy pasting */}
              <div className="rounded-3xl border border-white/10 bg-black/60 p-5 relative z-10 backdrop-blur-md">
                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground block mb-2">
                  Format Teks Cepat (Bintang)
                </span>
                <p className="font-mono text-[12px] text-primary/80 break-all leading-relaxed max-h-48 overflow-y-auto scrollbar-none select-all drop-shadow-[0_0_5px_currentColor]">
                  {all700Lines.join(separator)}
                </p>
              </div>
            </div>
          </div>

          {/* Grouped Lists (Bento Grid Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Line Utama (100 Line) */}
            <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider">Line Utama (100 LN)</h4>
                </div>
                <button
                  onClick={() => copyText(lineUtama.map(x => x.num), "utama")}
                  className="rounded px-2 py-1 text-[10px] font-bold border border-indigo-500/35 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                >
                  {copiedGroup === "utama" ? "Disalin!" : "Copy 100 LN"}
                </button>
              </div>
              <p className="text-[10px] text-indigo-300/70 leading-normal">
                100 Kombinasi dengan akumulasi skor tertinggi & momentum paling stabil.
              </p>
              <div className="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {lineUtama.map((item) => (
                  <div key={item.num} className="text-center bg-indigo-500/10 rounded-lg border border-indigo-500/20 py-1.5">
                    <div className="font-mono text-xs font-black text-indigo-300">{item.num}</div>
                    <div className="text-[7px] text-indigo-400/80 mt-0.5">{item.score}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Line Cadangan (300 Line) */}
            <div className="rounded-3xl border border-violet-500/25 bg-violet-500/5 p-5 space-y-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="text-xs font-black text-violet-400 uppercase tracking-wider">Line Cadangan (300 LN)</h4>
                </div>
                <button
                  onClick={() => copyText(lineCadangan.map(x => x.num), "cadangan")}
                  className="rounded px-2 py-1 text-[10px] font-bold border border-violet-500/25 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors"
                >
                  {copiedGroup === "cadangan" ? "Disalin!" : "Copy 300 LN"}
                </button>
              </div>
              <p className="text-[10px] text-violet-300/70 leading-normal">
                Kombinasi pendukung berfrekuensi tinggi & trend kuat yang berpotensi melesat.
              </p>
              <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto pr-1">
                {lineCadangan.map((item) => (
                  <div key={item.num} className="text-center bg-violet-500/5 rounded-lg border border-violet-500/15 py-1">
                    <div className="font-mono text-[10px] font-bold text-violet-200">{item.num}</div>
                    <div className="text-[6px] text-violet-400/70 scale-90">{item.score}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Line Support (300 Line) */}
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-background p-5 space-y-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded bg-muted/40 text-muted-foreground flex items-center justify-center text-xs font-bold">3</div>
                  <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Line Support (300 LN)</h4>
                </div>
                <button
                  onClick={() => copyText(lineSupport.map(x => x.num), "support")}
                  className="rounded px-2 py-1 text-[10px] font-bold border border-border bg-muted/10 text-foreground hover:bg-muted/30 transition-colors"
                >
                  {copiedGroup === "support" ? "Disalin!" : "Copy 300 LN"}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Kombinasi dengan gap tinggi/overdue (lama tidak keluar) yang berpeluang keluar cepat.
              </p>
              <div className="grid grid-cols-5 gap-1 max-h-48 overflow-y-auto pr-1">
                {lineSupport.map((item) => (
                  <div key={item.num} className="text-center bg-muted/10 rounded-lg border border-border/40 py-1">
                    <div className="font-mono text-[10px] font-bold text-muted-foreground">{item.num}</div>
                    <div className="text-[6px] text-muted-foreground/60 scale-90">{item.score}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filtering Analysis Explanation Card */}
          <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card to-background p-6 space-y-5 shadow-sm backdrop-blur-xl">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              METODE FILTRASI AI 700 LINE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1 bg-black/10 border border-border/20 rounded-xl p-3">
                <span className="font-bold text-indigo-400 block">1. Exponential Decay (30%)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Menghitung bobot eksponensial di mana sesi draw yang baru keluar mendapatkan nilai jauh lebih tinggi dibanding sesi lama.
                </p>
              </div>
              <div className="space-y-1 bg-black/10 border border-border/20 rounded-xl p-3">
                <span className="font-bold text-violet-400 block">2. Position Probabilities (20%)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Menganalisis kekuatan digit Kop, Kepala dan Ekor secara mandiri, lalu menyatukan peluang rilisnya.
                </p>
              </div>
              <div className="space-y-1 bg-black/10 border border-border/20 rounded-xl p-3">
                <span className="font-bold text-blue-400 block">3. Markov Chain (15%)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mendeteksi probabilitas perpindahan (transisi) dari angka 3D terakhir yang keluar menuju angka rilis berikutnya.
                </p>
              </div>
              <div className="space-y-1 bg-black/10 border border-border/20 rounded-xl p-3">
                <span className="font-bold text-emerald-400 block">4. Overdue Rebound (15%)</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Menyisipkan kompensasi gap rilis. Angka dengan keterlambatan tinggi ditambahkan skor bayesian agar tidak tertinggal.
                </p>
              </div>
            </div>
          </div>

          {/* Saringan AI: Weak Numbers filter out list */}
          <div className="rounded-3xl border border-border/50 bg-card/60 p-5 space-y-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Saringan AI: 300 Line yang Dieliminasi</h4>
                <p className="text-[10px] text-muted-foreground">Angka terlemah/paling dingin berdasarkan hitungan data saat ini.</p>
              </div>
              <button
                onClick={() => setShowWeakLines(!showWeakLines)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-[10px] font-bold px-3 py-1.5 transition-colors"
              >
                {showWeakLines ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showWeakLines ? "Sembunyikan" : "Tampilkan 300 LN Lemah"}
              </button>
            </div>

            {showWeakLines && (
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1 justify-center max-h-64 overflow-y-auto pr-1">
                  {lineLemah.map((item) => (
                    <div
                      key={item.num}
                      className="flex flex-col items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-muted-foreground/60 py-1"
                      title={`Kombinasi lemah: ${item.num} - Rank #${item.rank}`}
                    >
                      <span className="font-mono text-[10px] font-bold line-through">{item.num}</span>
                      <span className="text-[6px] text-red-400/55">{item.score}%</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3 flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Saran Manajemen Risiko:</strong> Ke-300 line di atas adalah angka dengan skor di bawah ambang batas (cutoff) analitik. AI menyarankan untuk membatasi/menghilangkan angka ini dari taruhan Anda guna meningkatkan efisiensi modal.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
