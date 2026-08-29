"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { AuthGatewayHub } from "@/components/AuthGatewayHub";
import { ConnectedAccountsList } from "@/components/ConnectedAccountsList";
import { PostComposer } from "@/components/PostComposer";
import { JobStatusTracker } from "@/components/JobStatusTracker";
import { ApiTrafficInspector } from "@/components/ApiTrafficInspector";
import { CodeSnippetShowcase } from "@/components/CodeSnippetShowcase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiTrafficEntry, GatewayConfig, Post, SocialAccount } from "@/lib/types";
import { fetchAccountsAction, fetchPostsListAction } from "./actions/gateway";
import {
  Link2,
  Users,
  Send,
  Activity,
  Terminal,
  Code2,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  Server,
} from "lucide-react";

export default function HomePage() {
  const [config, setConfig] = useState<GatewayConfig>({
    gatewayUrl:
      process.env.NEXT_PUBLIC_OB_GATEWAY_URL || "https://autopost.otherbrain.tech",
    apiKey:
      process.env.NEXT_PUBLIC_OB_API_KEY || "dev_api_key_123",
    tenantId:
      process.env.NEXT_PUBLIC_OB_TENANT_ID || "11111111-2222-3333-4444-555555555555",
    clientUserId:
      process.env.NEXT_PUBLIC_DEFAULT_CLIENT_USER_ID || "demo_client_user",
  });

  const [activeTab, setActiveTab] = useState<string>("auth");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [trafficEntries, setTrafficEntries] = useState<ApiTrafficEntry[]>([]);

  // Function to record HTTP requests in the Inspector log
  const recordTraffic = useCallback(
    (
      method: "GET" | "POST" | "DELETE" | "OPTIONS",
      endpoint: string,
      status: number,
      durationMs: number,
      headers: Record<string, string>,
      body?: unknown,
      response?: unknown
    ) => {
      const newEntry: ApiTrafficEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        method,
        endpoint,
        status,
        durationMs,
        requestHeaders: headers,
        requestBody: body,
        responseBody: response,
      };
      setTrafficEntries((prev) => [newEntry, ...prev.slice(0, 49)]); // Keep last 50
    },
    []
  );

  // Load Accounts for active user
  const loadAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    const start = performance.now();
    try {
      const res = await fetchAccountsAction(
        {
          gatewayUrl: config.gatewayUrl,
          apiKey: config.apiKey,
          tenantId: config.tenantId,
        },
        config.clientUserId
      );

      const ms = Math.round(performance.now() - start);
      recordTraffic(
        "GET",
        `/v1/accounts?client_user_id=${config.clientUserId}`,
        res.success ? 200 : 500,
        ms,
        { "X-API-Key": config.apiKey },
        undefined,
        res.data
      );

      if (res.success) {
        setAccounts(res.data);
      }
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [config, recordTraffic]);

  // Load Posts history
  const loadPosts = useCallback(async () => {
    const start = performance.now();
    const res = await fetchPostsListAction({
      gatewayUrl: config.gatewayUrl,
      apiKey: config.apiKey,
      tenantId: config.tenantId,
    });
    const ms = Math.round(performance.now() - start);
    recordTraffic(
      "GET",
      `/v1/posts?tenant_id=${config.tenantId}`,
      res.success ? 200 : 500,
      ms,
      { "X-API-Key": config.apiKey },
      undefined,
      res.data
    );

    if (res.success) {
      setPosts(res.data);
    }
  }, [config, recordTraffic]);

  useEffect(() => {
    loadAccounts();
    loadPosts();
  }, [loadAccounts, loadPosts]);

  const activeAccountsCount = accounts.filter((a) => a.is_active).length;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        config={config}
        onUpdateConfig={(newCfg) => setConfig(newCfg)}
        onRefresh={() => {
          loadAccounts();
          loadPosts();
        }}
      />

      {/* Hero / Quick Stats Sub-header */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stat 1: Cuentas Conectadas */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{activeAccountsCount}</div>
                <div className="text-xs text-slate-400 font-medium">Cuentas Vinculadas</div>
              </div>
            </div>

            {/* Stat 2: Posts Procesados */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{posts.length}</div>
                <div className="text-xs text-slate-400 font-medium">Posts en Pasarela</div>
              </div>
            </div>

            {/* Stat 3: Peticiones HTTP en Vivo */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{trafficEntries.length}</div>
                <div className="text-xs text-slate-400 font-medium">Logs HTTP API</div>
              </div>
            </div>

            {/* Stat 4: Despliegue en Vercel */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">Vercel Ready</div>
                <div className="text-xs text-slate-400">App Router & RSC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto flex-wrap">
              <TabsTrigger value="auth" className="text-xs sm:text-sm">
                <Link2 className="w-4 h-4 text-blue-400" />
                <span>1. Pasarela OAuth</span>
              </TabsTrigger>

              <TabsTrigger value="accounts" className="text-xs sm:text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>2. Cuentas ({activeAccountsCount})</span>
              </TabsTrigger>

              <TabsTrigger value="compose" className="text-xs sm:text-sm">
                <Send className="w-4 h-4 text-indigo-400" />
                <span>3. Publicador Automático</span>
              </TabsTrigger>

              <TabsTrigger value="history" className="text-xs sm:text-sm">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>4. Monitor de Trabajos</span>
              </TabsTrigger>

              <TabsTrigger value="inspector" className="text-xs sm:text-sm">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>5. Inspector API ({trafficEntries.length})</span>
              </TabsTrigger>

              <TabsTrigger value="code" className="text-xs sm:text-sm">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>6. Código SDK</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Auth Hub */}
          <TabsContent value="auth">
            <AuthGatewayHub
              config={config}
              accounts={accounts}
              isLoading={isLoadingAccounts}
              onRefreshAccounts={loadAccounts}
              onRecordTraffic={recordTraffic}
            />
          </TabsContent>

          {/* Tab 2: Connected Accounts List */}
          <TabsContent value="accounts">
            <ConnectedAccountsList
              accounts={accounts}
              config={config}
              isLoading={isLoadingAccounts}
              onRefresh={loadAccounts}
              onSelectTab={setActiveTab}
              onRecordTraffic={recordTraffic}
            />
          </TabsContent>

          {/* Tab 3: Post Composer */}
          <TabsContent value="compose">
            <PostComposer
              accounts={accounts}
              config={config}
              onPostCreated={(newPost) => {
                setPosts((prev) => [newPost, ...prev]);
                setActiveTab("history");
              }}
              onSelectTab={setActiveTab}
              onRecordTraffic={recordTraffic}
            />
          </TabsContent>

          {/* Tab 4: Job Status Monitor */}
          <TabsContent value="history">
            <JobStatusTracker
              posts={posts}
              config={config}
              onRefreshPosts={loadPosts}
              onSelectTab={setActiveTab}
              onRecordTraffic={recordTraffic}
            />
          </TabsContent>

          {/* Tab 5: Live API Traffic Inspector */}
          <TabsContent value="inspector">
            <ApiTrafficInspector
              entries={trafficEntries}
              config={config}
              onClear={() => setTrafficEntries([])}
            />
          </TabsContent>

          {/* Tab 6: Integration Code Showcase */}
          <TabsContent value="code">
            <CodeSnippetShowcase config={config} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Mini Demo MarketHub &bull; Desarrollado para OtherBrain Tech &bull; Conectado a Pasarela OB-AutoPost
          </p>
        </div>
      </footer>
    </div>
  );
}
