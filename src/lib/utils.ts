export function formatCredits(n: number): string {
  return n.toLocaleString();
}

export function formatStat(n: number): string {
  return n.toFixed(2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentOf(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function alignmentLabel(alignment: number): string {
  if (alignment > 50) return 'Saint';
  if (alignment > 20) return 'Neutral Good';
  if (alignment > -20) return 'Neutral';
  if (alignment > -50) return 'Rogue';
  return 'Outlaw';
}

export function alignmentColor(alignment: number): string {
  if (alignment > 20) return 'text-emerald-400';
  if (alignment > -20) return 'text-slate-300';
  return 'text-red-400';
}
