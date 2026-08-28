import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GatewayConfig } from "@/lib/types";
import { Settings, CheckCircle2, RotateCcw, X, Server, Key, User, Building } from "lucide-react";

interface GatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GatewayConfig;
  onSave: (newConfig: GatewayConfig) => void;
}

export function GatewaySettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
}: GatewaySettingsModalProps) {
  const [gatewayUrl, setGatewayUrl] = useState(config.gatewayUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [tenantId, setTenantId] = useState(config.tenantId);
  const [clientUserId, setClientUserId] = useState(config.clientUserId);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      gatewayUrl: gatewayUrl.trim().replace(/\/$/, ""),
      apiKey: apiKey.trim(),
      tenantId: tenantId.trim(),
      clientUserId: clientUserId.trim(),
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleResetDefaults = () => {
    setGatewayUrl(process.env.NEXT_PUBLIC_OB_GATEWAY_URL || "http://localhost:8087");
    setApiKey("dev_api_key_123");
    setTenantId("11111111-2222-3333-4444-555555555555");
    setClientUserId("demo_client_user");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-xl border-slate-700 bg-slate-900 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader>
          <div className="flex items-center gap-2 text-blue-400">
            <Settings className="w-5 h-5" />
            <CardTitle>Configuración de la Pasarela OB-AutoPost</CardTitle>
          </div>
          <CardDescription>
            Ajusta el endpoint de la pasarela y las credenciales de tu Tenant para probar en local o en producción (Vercel).
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" /> URL de la Pasarela (Backend API)
              </label>
              <Input
                type="text"
                value={gatewayUrl}
                onChange={(e) => setGatewayUrl(e.target.value)}
                placeholder="http://localhost:8087 o https://autopost.otherbrain.tech"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                La URL pública o local donde está ejecutándose el backend en Go de OB-AutoPost.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Tenant API Key
                </label>
                <Input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="dev_api_key_123"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" /> Tenant ID (UUID)
                </label>
                <Input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="11111111-2222-3333-4444-555555555555"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> ID de Usuario SaaS (Client User ID)
              </label>
              <Input
                type="text"
                value={clientUserId}
                onChange={(e) => setClientUserId(e.target.value)}
                placeholder="demo_client_user"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Identificador del usuario final dentro de tu SaaS. La pasarela asociará sus redes a este ID.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-slate-800 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetDefaults}
              className="text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar Defaults
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient">
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-300" /> Guardado!
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
