"use client";

import React, { useState } from "react";
import { ApiTrafficEntry, GatewayConfig } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Terminal,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Code2,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ApiTrafficInspectorProps {
  entries: ApiTrafficEntry[];
  config: GatewayConfig;
  onClear: () => void;
}

export function ApiTrafficInspector({
  entries,
  config,
  onClear,
}: ApiTrafficInspectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyCurl = (entry: ApiTrafficEntry) => {
    const fullUrl = `${config.gatewayUrl}${entry.endpoint.split(" ")[0]}`;
    let curl = `curl -X ${entry.method} "${fullUrl}" \\\n  -H "X-API-Key: ${config.apiKey}" \\\n  -H "Content-Type: application/json"`;

    if (entry.requestBody && entry.method === "POST") {
      curl += ` \\\n  -d '${JSON.stringify(entry.requestBody, null, 2)}'`;
    }

    navigator.clipboard.writeText(curl);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Inspector de Tráfico de la Pasarela (Live Gateway Logs)
                <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono">
                  {entries.length} peticiones
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Audita en tiempo real las llamadas HTTP REST y OAuth intercambiadas entre esta app y OB-AutoPost.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={entries.length === 0}
            className="text-xs text-slate-400 hover:text-rose-400 h-8"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpiar Consola
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No hay llamadas registradas aún. Realiza una acción (vincular cuenta o publicar) para inspeccionar los payloads HTTP.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 max-h-[520px] overflow-y-auto font-mono text-xs">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isCopied = copiedId === entry.id;

              return (
                <div key={entry.id} className="hover:bg-slate-950/40 transition">
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleExpand(entry.id)}
                    className="flex items-center justify-between p-3.5 cursor-pointer select-none gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}

                      {/* Method Badge */}
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          entry.method === "POST"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : entry.method === "GET"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {entry.method}
                      </span>

                      {/* Endpoint */}
                      <span className="text-slate-200 truncate font-semibold">
                        {entry.endpoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Duration */}
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {entry.durationMs}ms
                      </span>

                      {/* Status Code */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          entry.status < 300
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : entry.status < 400
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {entry.status}
                      </span>

                      {/* Copy cURL */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCurl(entry);
                        }}
                        title="Copiar comando cURL"
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-3 animate-fade-in text-[11px]">
                      {/* Request Info */}
                      <div>
                        <div className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                          Encabezados Enviados (Headers):
                        </div>
                        <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto">
                          {JSON.stringify(entry.requestHeaders, null, 2)}
                        </pre>
                      </div>

                      {entry.requestBody !== undefined && (
                        <div>
                          <div className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                            Cuerpo de la Petición (Request JSON):
                          </div>
                          <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto">
                            {JSON.stringify(entry.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}

                      {entry.responseBody !== undefined && (
                        <div>
                          <div className="text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">
                            Respuesta de la Pasarela (Response JSON):
                          </div>
                          <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto">
                            {JSON.stringify(entry.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
