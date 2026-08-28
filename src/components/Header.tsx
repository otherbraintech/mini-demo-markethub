"use client";

import React, { useState, useEffect } from "react";
import { GatewayConfig } from "@/lib/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { GatewaySettingsModal } from "./GatewaySettingsModal";
import {
  Server,
  Settings,
  Activity,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookOpen
} from "lucide-react";

interface HeaderProps {
  config: GatewayConfig;
  onUpdateConfig: (newConfig: GatewayConfig) => void;
  onRefresh: () => void;
}

export function Header({ config, onUpdateConfig, onRefresh }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const checkPing = async () => {
    setChecking(true);
    const start = performance.now();
    try {
      const res = await fetch(`${config.gatewayUrl}/`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      const ms = Math.round(performance.now() - start);
      setLatency(ms);
      setIsOnline(res.status < 500);
    } catch {
      setIsOnline(false);
      setLatency(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkPing();
    const interval = setInterval(checkPing, 15000);
    return () => clearInterval(interval);
  }, [config.gatewayUrl]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  OB-AutoPost
                </h1>
                <Badge variant="default" className="text-[10px] py-0 px-2 uppercase tracking-wider">
                  Pasarela SaaS
                </Badge>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Demostración de Integración Desacoplada (Vercel &rarr; OB-AutoPost Gateway)
              </p>
            </div>
          </div>

          {/* Center Info: Gateway URL & User Context */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-500 font-mono">Gateway:</span>
              <span className="text-slate-200 font-mono max-w-[200px] truncate" title={config.gatewayUrl}>
                {config.gatewayUrl}
              </span>
            </div>
            <div className="w-px h-3.5 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-500">Usuario SaaS:</span>
              <span className="text-emerald-400 font-semibold">{config.clientUserId}</span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gateway Status Badge */}
            <button
              onClick={checkPing}
              title="Haz clic para volver a comprobar la conexión"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnline === true
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/80 animate-pulse"
                    : isOnline === false
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="font-medium text-slate-300 hidden sm:inline">
                {checking
                  ? "Comprobando..."
                  : isOnline === true
                  ? `Online (${latency}ms)`
                  : isOnline === false
                  ? "Offline"
                  : "Conectando..."}
              </span>
            </button>

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Ajustes de Pasarela</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Gateway Settings Modal */}
      <GatewaySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={(newCfg) => {
          onUpdateConfig(newCfg);
          onRefresh();
        }}
      />
    </>
  );
}
