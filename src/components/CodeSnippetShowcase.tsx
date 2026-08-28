"use client";

import React, { useState } from "react";
import { GatewayConfig } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Code2, Copy, Check, Terminal, FileCode, Layers } from "lucide-react";

interface CodeSnippetShowcaseProps {
  config: GatewayConfig;
}

export function CodeSnippetShowcase({ config }: CodeSnippetShowcaseProps) {
  const [activeLang, setActiveLang] = useState<"nextjs" | "typescript" | "curl" | "python">("nextjs");
  const [copied, setCopied] = useState(false);

  const snippets = {
    nextjs: `// app/actions/autopost.ts
'use server';

export async function publishToSocialMedia(formData: {
  socialAccountId: string;
  caption: string;
  mediaUrl: string;
}) {
  const response = await fetch('${config.gatewayUrl}/v1/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '${config.apiKey}',
    },
    body: JSON.stringify({
      tenant_id: '${config.tenantId}',
      social_account_id: formData.socialAccountId,
      media_url: formData.mediaUrl,
      caption: formData.caption,
      post_type: 'VIDEO', // 'VIDEO', 'IMAGE', o 'TEXT'
    }),
  });

  if (!response.ok) {
    throw new Error('Error enviando post a la pasarela OB-AutoPost');
  }

  const data = await response.json();
  return data; // { success: true, data: { id: "...", status: "PENDING" } }
}`,
    typescript: `// lib/ob-gateway.ts
import axios from 'axios';

const OB_GATEWAY_URL = '${config.gatewayUrl}';
const API_KEY = '${config.apiKey}';
const TENANT_ID = '${config.tenantId}';

// 1. Obtener cuentas activas del usuario
export async function getConnectedAccounts(clientUserId: string) {
  const { data } = await axios.get(\`\${OB_GATEWAY_URL}/v1/accounts?client_user_id=\${clientUserId}\`, {
    headers: { 'X-API-Key': API_KEY }
  });
  return data;
}

// 2. Programar publicación
export async function schedulePost(accountId: string, caption: string, mediaUrl: string) {
  const { data } = await axios.post(\`\${OB_GATEWAY_URL}/v1/posts\`, {
    tenant_id: TENANT_ID,
    social_account_id: accountId,
    media_url: mediaUrl,
    caption: caption,
    post_type: 'VIDEO'
  }, {
    headers: { 'X-API-Key': API_KEY }
  });
  return data;
}`,
    curl: `# 1. Iniciar Vinculación OAuth (abrir en navegador o popup)
${config.gatewayUrl}/v1/auth/tiktok/login?tenant_id=${config.tenantId}&client_user_id=${config.clientUserId}

# 2. Listar Cuentas Conectadas del Usuario
curl -X GET "${config.gatewayUrl}/v1/accounts?client_user_id=${config.clientUserId}" \\
  -H "X-API-Key: ${config.apiKey}"

# 3. Publicar Video o Imagen en Red Social
curl -X POST "${config.gatewayUrl}/v1/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${config.apiKey}" \\
  -d '{
    "tenant_id": "${config.tenantId}",
    "social_account_id": "ACC_UUID_HERE",
    "media_url": "https://ejemplo.com/video.mp4",
    "caption": "Publicación automática desde mi app #tech",
    "post_type": "VIDEO"
  }'

# 4. Consultar Estado de la Publicación
curl -X GET "${config.gatewayUrl}/v1/posts/POST_UUID_HERE" \\
  -H "X-API-Key: ${config.apiKey}"`,
    python: `import requests

GATEWAY_URL = "${config.gatewayUrl}"
API_KEY = "${config.apiKey}"
TENANT_ID = "${config.tenantId}"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Crear y encolar publicación
payload = {
    "tenant_id": TENANT_ID,
    "social_account_id": "ACC_UUID_HERE",
    "media_url": "https://ejemplo.com/video.mp4",
    "caption": "Post automático con OB-AutoPost #python",
    "post_type": "VIDEO"
}

response = requests.post(f"{GATEWAY_URL}/v1/posts", json=payload, headers=headers)
print("Respuesta de la pasarela:", response.json())`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
      <CardHeader className="pb-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Guía Rápida de Integración (SDK & Ejemplos de Código)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Copia y pega estos ejemplos en cualquier proyecto para conectar con tu pasarela OB-AutoPost.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5 bg-slate-900 border-slate-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar Código
              </>
            )}
          </Button>
        </div>

        {/* Language Tabs */}
        <div className="flex gap-2 pt-3">
          {(["nextjs", "typescript", "curl", "python"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                activeLang === lang
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {lang === "nextjs" && "Next.js (Server Action)"}
              {lang === "typescript" && "TypeScript / Node"}
              {lang === "curl" && "cURL (REST API)"}
              {lang === "python" && "Python (Requests)"}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 bg-slate-950/90 font-mono text-xs overflow-x-auto text-slate-200">
        <pre className="leading-relaxed">
          <code>{snippets[activeLang]}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
