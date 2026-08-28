"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GatewayConfig, SocialAccount, SocialPlatform, OAuthCallbackPayload } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Link2,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Info,
  Radio,
  ArrowUpRight,
  RefreshCw,
  LogOut,
} from "lucide-react";

interface AuthGatewayHubProps {
  config: GatewayConfig;
  accounts: SocialAccount[];
  isLoading: boolean;
  onRefreshAccounts: () => void;
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

interface PlatformCardConfig {
  platform: SocialPlatform;
  title: string;
  subtitle: string;
  description: string;
  iconBg: string;
  badgeColor: string;
  scopes: string[];
  colorGradient: string;
  authRoute: string;
}

const PLATFORMS: PlatformCardConfig[] = [
  {
    platform: "FACEBOOK",
    title: "Facebook Pages",
    subtitle: "Páginas Comerciales y Fanpages",
    description: "Publicación automatizada en el feed de tus páginas de Facebook y gestión de comentarios.",
    iconBg: "bg-[#1877f2]/15 text-[#1877f2] border-[#1877f2]/30",
    badgeColor: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    scopes: ["pages_show_list", "pages_manage_posts", "pages_read_engagement"],
    colorGradient: "from-blue-600 to-blue-800",
    authRoute: "/v1/auth/facebook/login",
  },
  {
    platform: "INSTAGRAM",
    title: "Instagram Business",
    subtitle: "Cuentas Profesionales / Creadores",
    description: "Publicación directa de Reels, fotos, carruseles y respuesta automática a comentarios vía IA.",
    iconBg: "bg-[#e1306c]/15 text-[#e1306c] border-[#e1306c]/30",
    badgeColor: "bg-pink-600/20 text-pink-400 border-pink-500/30",
    scopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_comments"],
    colorGradient: "from-pink-600 via-purple-600 to-amber-500",
    authRoute: "/v1/auth/facebook/login", // Or /v1/auth/instagram/login
  },
  {
    platform: "TIKTOK",
    title: "TikTok Direct Posting",
    subtitle: "Cuentas de Creadores y Empresas",
    description: "Publicación directa de videos a TikTok mediante la API oficial v2 de Direct Post.",
    iconBg: "bg-[#fe2c55]/15 text-[#25f4ee] border-[#fe2c55]/30",
    badgeColor: "bg-rose-600/20 text-rose-400 border-rose-500/30",
    scopes: ["user.info.basic", "video.publish", "video.upload"],
    colorGradient: "from-[#fe2c55] to-[#25f4ee]",
    authRoute: "/v1/auth/tiktok/login",
  },
  {
    platform: "LINKEDIN",
    title: "LinkedIn Pages & Profiles",
    subtitle: "Páginas de Empresa y Perfiles",
    description: "Publicación de artículos, imágenes, videos y actualizaciones corporativas en LinkedIn.",
    iconBg: "bg-[#0a66c2]/15 text-[#0a66c2] border-[#0a66c2]/30",
    badgeColor: "bg-sky-600/20 text-sky-400 border-sky-500/30",
    scopes: ["w_member_social", "w_organization_social", "r_organization_social"],
    colorGradient: "from-[#0a66c2] to-blue-900",
    authRoute: "/v1/auth/linkedin/login",
  },
];

export function AuthGatewayHub({
  config,
  accounts,
  isLoading,
  onRefreshAccounts,
  onRecordTraffic,
}: AuthGatewayHubProps) {
  const [activePopup, setActivePopup] = useState<Window | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Listen to postMessage from the OB-AutoPost OAuth callback window
  const handlePostMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data as OAuthCallbackPayload;
      if (!data || typeof data !== "object") return;

      if (data.type === "OAUTH_SUCCESS") {
        setConnectingPlatform(null);
        setNotification({
          type: "success",
          message: `¡Cuenta ${data.platform.toUpperCase()} conectada con éxito a través de la pasarela!`,
        });

        // Record visual traffic
        onRecordTraffic(
          "GET",
          `/v1/auth/${data.platform}/callback (OAuth Event)`,
          200,
          120,
          { "X-Tenant-ID": config.tenantId },
          undefined,
          data
        );

        onRefreshAccounts();

        setTimeout(() => {
          setNotification(null);
        }, 5000);
      }
    },
    [config.tenantId, onRefreshAccounts, onRecordTraffic]
  );

  useEffect(() => {
    window.addEventListener("message", handlePostMessage);
    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, [handlePostMessage]);

  const handleConnect = (platformCfg: PlatformCardConfig) => {
    setConnectingPlatform(platformCfg.platform);
    setNotification(null);

    const loginUrl = `${config.gatewayUrl}${platformCfg.authRoute}?tenant_id=${encodeURIComponent(
      config.tenantId
    )}&client_user_id=${encodeURIComponent(config.clientUserId)}`;

    onRecordTraffic(
      "GET",
      `${platformCfg.authRoute}?tenant_id=${config.tenantId}&client_user_id=${config.clientUserId}`,
      302,
      80,
      { "X-API-Key": config.apiKey }
    );

    // Open clean popup window
    const width = 600;
    const height = 720;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      loginUrl,
      `oauth_${platformCfg.platform}`,
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no,menubar=no`
    );

    if (popup) {
      setActivePopup(popup);
    } else {
      // Fallback if popup blocked
      window.open(loginUrl, "_blank");
    }
  };

  const getConnectedCount = (platform: SocialPlatform) => {
    return accounts.filter((a) => a.platform === platform && a.is_active).length;
  };

  return (
    <div className="space-y-6">
      {/* Pasarela OAuth Explanation Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/60 p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Arquitectura de Pasarela Desacoplada (OAuth Headless)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Autenticación Multired sin Registrar Apps en Meta/TikTok
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Tu aplicación SaaS (desplegada en Vercel) delega el flujo de autenticación, refresco de tokens permanentes y encriptación AES-256 a la pasarela <b>OB-AutoPost</b>. Al autorizar, la cuenta queda mapeada a tu <code className="text-cyan-300 font-mono text-xs">client_user_id: {config.clientUserId}</code>.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshAccounts}
            disabled={isLoading}
            className="flex items-center gap-2 whitespace-nowrap bg-slate-900/80 border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sincronizar Cuentas</span>
          </Button>
        </div>

        {/* Global Notification Toast */}
        {notification && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Grid of 4 OAuth Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLATFORMS.map((platformCfg) => {
          const count = getConnectedCount(platformCfg.platform);
          const isConnected = count > 0;
          const isConnecting = connectingPlatform === platformCfg.platform;

          return (
            <Card
              key={platformCfg.platform}
              className={`border transition-all duration-300 hover:border-slate-700 bg-slate-900/80 ${
                isConnected ? "border-slate-700/90 shadow-lg shadow-black/40" : "border-slate-800/80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border font-bold text-lg ${platformCfg.iconBg}`}
                    >
                      {platformCfg.platform === "FACEBOOK" && "FB"}
                      {platformCfg.platform === "INSTAGRAM" && "IG"}
                      {platformCfg.platform === "TIKTOK" && "TT"}
                      {platformCfg.platform === "LINKEDIN" && "IN"}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        {platformCfg.title}
                        {isConnected && (
                          <Badge variant="success" className="text-[10px] py-0 px-2">
                            {count} {count === 1 ? "Conectada" : "Conectadas"}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        {platformCfg.subtitle}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-600"
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-400">
                      {isConnected ? "Activa" : "No vinculada"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                  {platformCfg.description}
                </p>

                {/* Scopes Requested by Gateway */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-slate-500" /> Permisos Gestionados por la Pasarela:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {platformCfg.scopes.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-mono">
                  Endpoint: <span className="text-slate-300">{platformCfg.authRoute}</span>
                </div>

                <Button
                  variant={isConnected ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleConnect(platformCfg)}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando...
                    </>
                  ) : isConnected ? (
                    <>
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" /> Vincular Otra Cuenta
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Conectar {platformCfg.title}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
