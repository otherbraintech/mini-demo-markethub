"use client";

import React, { useState } from "react";
import { GatewayConfig, SocialAccount } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getPlatformBadge, formatDate } from "@/lib/utils";
import { disconnectAccountAction } from "@/app/actions/gateway";
import {
  Users,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
  UserCheck
} from "lucide-react";

interface ConnectedAccountsListProps {
  accounts: SocialAccount[];
  config: GatewayConfig;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectTab: (tab: string) => void;
  onRecordTraffic: (
    method: "GET" | "POST" | "DELETE" | "OPTIONS",
    endpoint: string,
    status: number,
    durationMs: number,
    headers: Record<string, string>,
    body?: unknown,
    response?: unknown
  ) => void;
}

export function ConnectedAccountsList({
  accounts,
  config,
  isLoading,
  onRefresh,
  onSelectTab,
  onRecordTraffic,
}: ConnectedAccountsListProps) {
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.is_active);

  const handleDisconnect = async (accountId: string, username: string) => {
    if (!confirm(`¿Estás seguro de desconectar la cuenta "${username}"?`)) return;

    setDisconnectingId(accountId);
    const start = performance.now();
    try {
      const res = await disconnectAccountAction(accountId, {
        gatewayUrl: config.gatewayUrl,
        apiKey: config.apiKey,
        tenantId: config.tenantId,
      });

      const ms = Math.round(performance.now() - start);
      onRecordTraffic(
        "POST",
        `/v1/accounts/${accountId}/disconnect`,
        res.success ? 200 : 500,
        ms,
        { "X-API-Key": config.apiKey },
        undefined,
        res
      );

      if (res.success) {
        onRefresh();
      } else {
        alert(res.error || "Error al desconectar la cuenta");
      }
    } finally {
      setDisconnectingId(null);
    }
  };

  if (activeAccounts.length === 0 && !isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-4 text-slate-400">
          <Users className="w-8 h-8" />
        </div>
        <CardTitle className="text-lg font-bold mb-2">No hay cuentas sociales conectadas</CardTitle>
        <CardDescription className="max-w-md mx-auto mb-6 text-sm">
          Aún no has vinculado cuentas de redes sociales para el usuario{" "}
          <code className="text-emerald-400 font-mono font-semibold">{config.clientUserId}</code>.
          Conecta Facebook, Instagram, TikTok o LinkedIn a través de la pasarela.
        </CardDescription>
        <Button
          variant="gradient"
          size="sm"
          onClick={() => onSelectTab("auth")}
          className="mx-auto"
        >
          Ir al Hub de Autenticación OAuth
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            Cuentas Activas Vinculadas ({activeAccounts.length})
          </h3>
          <p className="text-xs text-slate-400">
            Perfiles autorizados listos para recibir publicaciones automatizadas desde este SaaS.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAccounts.map((account) => {
          const badge = getPlatformBadge(account.platform);
          const isDisconnecting = disconnectingId === account.id;

          return (
            <Card
              key={account.id}
              className="border-slate-800 bg-slate-900/90 hover:border-slate-700 transition relative overflow-hidden group"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      {account.platform_avatar_url ? (
                        <img
                          src={account.platform_avatar_url}
                          alt={account.platform_username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                          onError={(e) => {
                            // Fallback on image load error
                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              account.platform_username
                            )}&background=1e293b&color=cbd5e1`;
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {account.platform_username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded-full border border-slate-900 ${badge.iconBg}`}
                      >
                        {account.platform === "FACEBOOK" && "FB"}
                        {account.platform === "INSTAGRAM" && "IG"}
                        {account.platform === "TIKTOK" && "TT"}
                        {account.platform === "LINKEDIN" && "IN"}
                      </div>
                    </div>

                    {/* Name and ID */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white truncate" title={account.platform_username}>
                        {account.platform_username}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate" title={account.platform_account_id}>
                        ID: {account.platform_account_id}
                      </p>
                      <div className="mt-1">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${badge.iconBg}`}
                        >
                          {badge.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                {/* Account Details */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">UUID Pasarela:</span>
                    <span className="font-mono text-[11px] text-slate-300 truncate max-w-[140px]" title={account.id}>
                      {account.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sincronizado:</span>
                    <span className="text-[11px] text-slate-300">{formatDate(account.created_at)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id, account.platform_username)}
                    disabled={isDisconnecting}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    {isDisconnecting ? "Desconectando..." : "Desconectar"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectTab("compose")}
                    className="text-xs h-8 px-3 text-slate-300 hover:text-white"
                  >
                    Publicar Aquí
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
