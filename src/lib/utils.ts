import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadge(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "PUBLISHED":
      return { label: "Publicado", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" };
    case "PENDING":
      return { label: "En Cola", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" };
    case "PROCESSING":
    case "DOWNLOADING":
    case "VALIDATING":
    case "UPLOADING":
      return { label: "Procesando", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" };
    case "AWAITING_WEBHOOK":
      return { label: "Esperando Webhook", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" };
    case "FAILED":
      return { label: "Error / Fallido", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" };
    default:
      return { label: status, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30" };
  }
}

export function getPlatformBadge(platform: string): { name: string; iconBg: string; textColor: string } {
  switch (platform) {
    case "TIKTOK":
      return { name: "TikTok", iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/30", textColor: "text-[#fe2c55]" };
    case "FACEBOOK":
      return { name: "Facebook", iconBg: "bg-blue-600/20 text-blue-400 border-blue-600/30", textColor: "text-[#1877f2]" };
    case "INSTAGRAM":
      return { name: "Instagram", iconBg: "bg-pink-600/20 text-pink-400 border-pink-600/30", textColor: "text-[#e1306c]" };
    case "LINKEDIN":
      return { name: "LinkedIn", iconBg: "bg-sky-600/20 text-sky-400 border-sky-600/30", textColor: "text-[#0a66c2]" };
    default:
      return { name: platform, iconBg: "bg-slate-700/50 text-slate-300 border-slate-600", textColor: "text-slate-200" };
  }
}
