const fs = require('fs');
const path = require('path');

const files = [
  'besar-ekor.tsx', 'besar.tsx', 'ganjil-ekor.tsx', 'ganjil.tsx',
  'genap-ekor.tsx', 'genap.tsx', 'kecil-ekor.tsx', 'kecil.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace imports
  content = content.replace(
    'import { useGetTotoMonths }', 
    'import { useMarketStore, MARKET_SESSIONS, MARKET_SESSION_LABELS } from "@/lib/market-store";\nimport { useGetTotoMonths }'
  );

  // Remove DRAW_TIMES and DRAW_LABELS
  content = content.replace(/const DRAW_TIMES = \[.*?\] as const;\n/, '');
  content = content.replace(/const DRAW_LABELS: Record<string, string> = \{.*?};\n/s, '');
  
  // Inside component
  content = content.replace(
    /const { data: months, isLoading } = useGetTotoMonths\(\);/g,
    'const activeMarket = useMarketStore(s => s.activeMarket);\n  const { data: months, isLoading } = useGetTotoMonths(activeMarket);'
  );

  content = content.replace(
    /const \[selectedTime, setSelectedTime\] = useState<"all" \| typeof DRAW_TIMES\[number\]>\("all"\);/g,
    'const [selectedTime, setSelectedTime] = useState<"all" | string>("all");'
  );

  content = content.replace(
    /const displayedTimes = selectedTime === "all" \? DRAW_TIMES : \[selectedTime\];/g,
    'const displayedTimes = selectedTime === "all" ? MARKET_SESSIONS[activeMarket] : [selectedTime];'
  );

  // Replace uses of DRAW_TIMES and DRAW_LABELS
  content = content.replace(/DRAW_TIMES\.map/g, 'MARKET_SESSIONS[activeMarket].map');
  content = content.replace(/DRAW_TIMES\.filter/g, 'MARKET_SESSIONS[activeMarket].filter');
  content = content.replace(/DRAW_LABELS\[t\]/g, 'MARKET_SESSION_LABELS[activeMarket][t]');
  
  // Also fix the text indicator e.g. "besar/6" to dynamic length if needed, or leave it.
  content = content.replace(/>besar\/6</g, '>{`besar/${MARKET_SESSIONS[activeMarket].length}`}<');
  content = content.replace(/>kecil\/6</g, '>{`kecil/${MARKET_SESSIONS[activeMarket].length}`}<');
  content = content.replace(/>ganjil\/6</g, '>{`ganjil/${MARKET_SESSIONS[activeMarket].length}`}<');
  content = content.replace(/>genap\/6</g, '>{`genap/${MARKET_SESSIONS[activeMarket].length}`}<');

  fs.writeFileSync(filePath, content);
}
