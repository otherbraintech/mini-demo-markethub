"use client";

import React, { useState, useEffect } from "react";
import { GatewayConfig, Post } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { getStatusBadge, formatDate } from "@/lib/utils";
import { fetchPostStatusAction } from "@/app/actions/gateway";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Layers,
  ExternalLink,
  Cpu,
  Video,
  Image as ImageIcon,
  FileText
} from "lucide-react";

interface JobStatusTrackerProps {
  posts: Post[];
  config: GatewayConfig;
  onRefreshPosts: () => void;
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

export function JobStatusTracker({
  posts,
  config,
  onRefreshPosts,
  onSelectTab,
  onRecordTraffic,
}: JobStatusTrackerProps) {
  const [activePosts, setActivePosts] = useState<Post[]>(posts);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    setActivePosts(posts);
  }, [posts]);

  // Poll posts that are still in progress
  useEffect(() => {
    const pendingPosts = activePosts.filter(
      (p) =>
        p.status === "PENDING" ||
        p.status === "DOWNLOADING" ||
        p.status === "VALIDATING" ||
        p.status === "PROCESSING" ||
        p.status === "UPLOADING" ||
        p.status === "AWAITING_WEBHOOK"
    );

    if (pendingPosts.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      for (const post of pendingPosts) {
        const start = performance.now();
        const res = await fetchPostStatusAction(post.id, {
          gatewayUrl: config.gatewayUrl,
          apiKey: config.apiKey,
          tenantId: config.tenantId,
        });

        const ms = Math.round(performance.now() - start);

        if (res.success && res.data) {
          onRecordTraffic("GET", `/v1/posts/${post.id}`, 200, ms, { "X-API-Key": config.apiKey }, undefined, res.data);
          setActivePosts((prev) =>
            prev.map((p) => (p.id === res.data!.id ? res.data! : p))
          );
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activePosts, config, onRecordTraffic]);

  if (activePosts.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-4 text-slate-400">
          <Layers className="w-8 h-8" />
        </div>
        <CardTitle className="text-lg font-bold mb-2">No hay publicaciones registradas</CardTitle>
        <CardDescription className="max-w-md mx-auto mb-6 text-sm">
          Aún no se han enviado publicaciones a través de la pasarela para este tenant.
        </CardDescription>
        <Button variant="gradient" size="sm" onClick={() => onSelectTab("compose")}>
          Crear Primera Publicación
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Historial de Trabajos y Trazabilidad ({activePosts.length})
          </h3>
          <p className="text-xs text-slate-400">
            Monitoreo en tiempo real de la cola de transcodificación y publicación de la pasarela.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPolling && (
            <Badge variant="warning" className="flex items-center gap-1.5 animate-pulse text-[11px]">
              <RefreshCw className="w-3 h-3 animate-spin" /> Worker Procesando...
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshPosts}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refrescar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {activePosts.map((post) => {
          const statusBadge = getStatusBadge(post.status);

          return (
            <Card
              key={post.id}
              className="border-slate-800 bg-slate-900/90 hover:border-slate-700 transition overflow-hidden"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Media Icon + Post Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-300">
                      {post.post_type === "VIDEO" && <Video className="w-5 h-5 text-blue-400" />}
                      {post.post_type === "IMAGE" && <ImageIcon className="w-5 h-5 text-pink-400" />}
                      {post.post_type === "TEXT" && <FileText className="w-5 h-5 text-emerald-400" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                        {post.caption || "Sin texto"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                        <span>ID: {post.id}</span>
                        <span>&bull;</span>
                        <span>{formatDate(post.created_at)}</span>
                        {post.scheduled_at && (
                          <>
                            <span>&bull;</span>
                            <span className="text-amber-400">
                              Programado: {formatDate(post.scheduled_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge & Extra Info */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} ${statusBadge.color}`}
                    >
                      {(post.status === "PENDING" || post.status === "PROCESSING") && (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      )}
                      {post.status === "PUBLISHED" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {post.status === "FAILED" && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      <span>{statusBadge.label}</span>
                    </div>

                    {post.publish_id && (
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        Publish ID: {post.publish_id}
                      </span>
                    )}

                    {post.error_message && (
                      <span className="text-[10px] text-rose-400 max-w-[200px] truncate" title={post.error_message}>
                        Error: {post.error_message}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
