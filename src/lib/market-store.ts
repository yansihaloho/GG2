import { create } from "zustand";

export type MarketType = "toto" | "hk" | "sgp" | "sdy";

export const MARKET_SESSIONS: Record<MarketType, string[]> = {
  toto: ["1300", "1600", "1900", "2200", "2300", "0001"],
  hk: ["0001"],
  sgp: ["0001"],
  sdy: ["0001"]
};

export const MARKET_SESSION_LABELS: Record<MarketType, Record<string, string>> = {
  toto: { "0001": "00:01", "1300": "13:00", "1600": "16:00", "1900": "19:00", "2200": "22:00", "2300": "23:00" },
  hk: { "0001": "23:00 (HK)" },
  sgp: { "0001": "17:45 (SGP)" },
  sdy: { "0001": "13:50 (SDY)" }
};

export const MARKET_NAMES: Record<MarketType, string> = {
  toto: "Toto Macau",
  hk: "Hongkong",
  sgp: "Singapore",
  sdy: "Sydney",
};

interface MarketStore {
  activeMarket: MarketType;
  setMarket: (m: MarketType) => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  activeMarket: "toto",
  setMarket: (m) => set({ activeMarket: m }),
}));
