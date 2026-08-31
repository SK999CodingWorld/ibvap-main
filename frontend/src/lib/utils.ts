import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | number) {
  return format(new Date(date), "PPP");
}

export function formatTime(date: string | Date | number) {
  return format(new Date(date), "HH:mm:ss");
}

export function timeAgo(date: string | Date | number) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function severityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/20 text-red-500 border-red-500/50';
    case 'high':
      return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
    case 'medium':
      return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
    case 'low':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    case 'info':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    case 'success':
      return 'bg-green-500/20 text-green-500 border-green-500/50';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
}

export function statusColor(status: string) {
  switch (status) {
    case 'online':
    case 'good':
      return 'text-green-500 bg-green-500/20';
    case 'offline':
    case 'critical':
      return 'text-red-500 bg-red-500/20';
    case 'degraded':
    case 'warning':
      return 'text-amber-500 bg-amber-500/20';
    default:
      return 'text-slate-500 bg-slate-500/20';
  }
}

export function formatRiskScore(score: number) {
  if (score >= 90) return 'text-red-500';
  if (score >= 70) return 'text-orange-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-green-500';
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
