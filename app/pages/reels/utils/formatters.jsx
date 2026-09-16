// ═══════════════════════════════════════════════════════════════════════
//  FORMATTERS
// ═══════════════════════════════════════════════════════════════════════

export function formatCount(num) {
  if (!num) return "0";
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}