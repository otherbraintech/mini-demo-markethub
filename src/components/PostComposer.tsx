"use client";

import React, { useState, useRef } from "react";
import { CreatePostInput, GatewayConfig, Post, PostType, SocialAccount } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { getPlatformBadge } from "@/lib/utils";
import { submitPostAction } from "@/app/actions/gateway";
import {
  Send,
  Upload,
  Video,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Link,
  Film,
  Layers,
  Hash,
  RefreshCw,
} from "lucide-react";

interface PostComposerProps {
  accounts: SocialAccount[];
  config: GatewayConfig;
  onPostCreated: (post: Post) => void;
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

const SAMPLE_MEDIA = [
  {
    name: "Video de Prueba (Vertical 9:16)",
    type: "VIDEO" as PostType,
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  },
  {
    name: "Imagen Demo (Cuadrada 1080x1080)",
    type: "IMAGE" as PostType,
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=80",
  },
];

const SUGGESTED_HASHTAGS = [
  "#obautopost",
  "#socialmedia",
  "#marketing",
  "#tech",
  "#automation",
  "#ai",
  "#saas",
];

export function PostComposer({
  accounts,
  config,
  onPostCreated,
  onSelectTab,
  onRecordTraffic,
}: PostComposerProps) {
  const activeAccounts = accounts.filter((a) => a.is_active);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    activeAccounts[0]?.id || ""
  );
  const [postType, setPostType] = useState<PostType>("VIDEO");
  const [mediaUrl, setMediaUrl] = useState<string>(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  );
  const [caption, setCaption] = useState<string>(
    "🚀 Publicación automatizada enviada desde MarketHub a través de la pasarela de posting! #markethub #automation #saas"
  );
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = activeAccounts.find((a) => a.id === selectedAccountId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    const start = performance.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${config.gatewayUrl}/v1/upload`, {
        method: "POST",
        headers: {
          "X-API-Key": config.apiKey,
        },
        body: formData,
      });

      const ms = Math.round(performance.now() - start);

      if (!res.ok) {
        throw new Error(`Upload falló con estado [${res.status}]: ${res.statusText}`);
      }

      const json = await res.json();
      onRecordTraffic("POST", "/v1/upload", res.status, ms, { "X-API-Key": config.apiKey }, { file: file.name, size: file.size }, json);

      if (json.url) {
        setMediaUrl(json.url);
        // Auto select type based on extension
        if (file.type.startsWith("image/")) {
          setPostType("IMAGE");
        } else if (file.type.startsWith("video/")) {
          setPostType("VIDEO");
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error subiendo archivo a la pasarela");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => `${prev.trim()} ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedAccountId) {
      setErrorMessage("Por favor selecciona una cuenta social de destino.");
      return;
    }

    if (postType !== "TEXT" && !mediaUrl.trim()) {
      setErrorMessage("Debes proporcionar una URL multimedia o subir un archivo.");
      return;
    }

    setIsSubmitting(true);
    const start = performance.now();

    // Extract hashtags from caption
    const hashtags = caption
      .split(/\s+/)
      .filter((w) => w.startsWith("#") && w.length > 1);

    const payload: CreatePostInput = {
      tenant_id: config.tenantId,
      social_account_id: selectedAccountId,
      media_url: postType === "TEXT" ? "" : mediaUrl.trim(),
      caption: caption.trim(),
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      post_type: postType,
      scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    try {
      const res = await submitPostAction(payload, {
        gatewayUrl: config.gatewayUrl,
        apiKey: config.apiKey,
        tenantId: config.tenantId,
      });

      const ms = Math.round(performance.now() - start);
      onRecordTraffic("POST", "/v1/posts", res.success ? 201 : 500, ms, { "X-API-Key": config.apiKey }, payload, res);

      if (res.success && res.data) {
        setSuccessMessage(`¡Post encolado exitosamente en la pasarela! ID: ${res.data.id}`);
        onPostCreated(res.data);
      } else {
        setErrorMessage(res.error || "No se pudo encolar el post en la pasarela.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error inesperado de red");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeAccounts.length === 0) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-4 text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <CardTitle className="text-lg font-bold mb-2">Se requiere al menos una cuenta vinculada</CardTitle>
        <CardDescription className="max-w-md mx-auto mb-6 text-sm">
          Para publicar contenido mediante la pasarela OB-AutoPost, primero debes conectar tu cuenta de Facebook, Instagram, TikTok o LinkedIn.
        </CardDescription>
        <Button variant="gradient" size="sm" onClick={() => onSelectTab("auth")}>
          Conectar Red Social Ahora
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Post Details Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Publicador de la Pasarela
              </div>
              <CardTitle className="text-xl font-bold">Componer y Enviar Publicación</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Este formulario enviará una solicitud <code className="font-mono text-cyan-400">POST /v1/posts</code> a la pasarela OB-AutoPost con tu API Key.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* 1. Account Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Cuenta Social de Destino
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeAccounts.map((acc) => {
                    const isSelected = acc.id === selectedAccountId;
                    const badge = getPlatformBadge(acc.platform);

                    return (
                      <button
                        type="button"
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                            : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {acc.platform_username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-white truncate">
                            {acc.platform_username}
                          </div>
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.iconBg}`}
                          >
                            {badge.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Post Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  2. Tipo de Publicación
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={postType === "VIDEO" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPostType("VIDEO")}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Video className="w-4 h-4" /> Video / Reel / TikTok
                  </Button>
                  <Button
                    type="button"
                    variant={postType === "IMAGE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPostType("IMAGE")}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" /> Imagen / Foto
                  </Button>
                  <Button
                    type="button"
                    variant={postType === "TEXT" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPostType("TEXT")}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" /> Solo Texto
                  </Button>
                </div>
              </div>

              {/* 3. Media Input & Upload */}
              {postType !== "TEXT" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-blue-400" /> 3. URL Multimedia o Carga Directa
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? "Subiendo a Pasarela..." : "Subir Archivo Local"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={postType === "VIDEO" ? "video/*" : "image/*"}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <Input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://tu-cdn.com/video.mp4 o https://tu-sitio.com/foto.jpg"
                    required
                  />

                  {/* Sample Presets */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Ejemplos rápidos:</span>
                    {SAMPLE_MEDIA.map((s) => (
                      <button
                        type="button"
                        key={s.name}
                        onClick={() => {
                          setMediaUrl(s.url);
                          setPostType(s.type);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Caption & Hashtags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> 4. Texto del Post (Caption)
                  </label>
                  <span className="text-xs text-slate-500 font-mono">
                    {caption.length} caracteres
                  </span>
                </div>

                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe el mensaje de tu publicación aquí..."
                  rows={4}
                  required
                />

                {/* Hashtag suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Añadir:
                  </span>
                  {SUGGESTED_HASHTAGS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => handleAddHashtag(tag)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/50 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Scheduling Mode */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Programar Publicación Futura</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {isScheduled && (
                  <div className="animate-fade-in pt-1">
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="text-xs"
                      required={isScheduled}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      El worker en segundo plano de OB-AutoPost publicará automáticamente el post cuando llegue la fecha establecida.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
              <div className="text-xs text-slate-400 font-mono">
                Tenant: <span className="text-slate-300 truncate">{config.tenantId.slice(0, 13)}...</span>
              </div>

              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting || isUploading}
                className="font-bold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Encolando Post...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Enviar a la Pasarela
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error al publicar</p>
                <p className="text-xs text-rose-300/90">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">¡Trabajo Encolado con Éxito!</p>
                <p className="text-xs text-emerald-300/90">{successMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Social Media Mock Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Film className="w-4 h-4 text-cyan-400" /> Vista Previa Simulada
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl overflow-hidden">
            {/* Header of Simulated Post */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                {selectedAccount?.platform_username.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white truncate">
                  {selectedAccount?.platform_username || "Cuenta Seleccionada"}
                </div>
                <div className="text-[10px] text-slate-500">
                  {selectedAccount?.platform || "RED SOCIAL"} &bull; {isScheduled ? "Programado" : "Ahora"}
                </div>
              </div>
            </div>

            {/* Media Box */}
            {postType !== "TEXT" && (
              <div className="w-full aspect-[9/12] max-h-[340px] rounded-xl bg-black flex items-center justify-center overflow-hidden relative border border-slate-800 mb-3">
                {mediaUrl ? (
                  postType === "VIDEO" ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80";
                      }}
                    />
                  )
                ) : (
                  <div className="text-center p-4 text-slate-600 text-xs">
                    <Film className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Sin archivo multimedia seleccionado
                  </div>
                )}
              </div>
            )}

            {/* Caption Text Box */}
            <div className="text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
              {caption || "El texto de tu publicación aparecerá aquí..."}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
