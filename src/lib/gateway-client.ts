import { CreatePostInput, Post, SocialAccount, SocialPlatform } from "./types";

export class OBGatewayClient {
  private gatewayUrl: string;
  private apiKey: string;
  private tenantId: string;

  constructor(options?: { gatewayUrl?: string; apiKey?: string; tenantId?: string }) {
    this.gatewayUrl = (
      options?.gatewayUrl ||
      process.env.NEXT_PUBLIC_OB_GATEWAY_URL ||
      "https://autopost.otherbrain.tech"
    ).replace(/\/$/, "");
    this.apiKey =
      options?.apiKey ||
      process.env.NEXT_PUBLIC_OB_API_KEY ||
      process.env.OB_API_KEY ||
      "dev_api_key_123";
    this.tenantId =
      options?.tenantId ||
      process.env.NEXT_PUBLIC_OB_TENANT_ID ||
      process.env.OB_TENANT_ID ||
      "11111111-2222-3333-4444-555555555555";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; status: number; durationMs: number }> {
    const url = `${this.gatewayUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has("X-API-Key")) {
      headers.set("X-API-Key", this.apiKey);
    }
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const start = performance.now();
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      const durationMs = Math.round(performance.now() - start);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gateway Error [${response.status}]: ${errorText || response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      let data: T;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      return { data, status: response.status, durationMs };
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - start);
      throw {
        message: err instanceof Error ? err.message : "Network error connecting to Gateway",
        durationMs,
      };
    }
  }

  // Generates the direct URL for initiating OAuth authorization via OB-AutoPost Gateway
  public getOAuthLoginUrl(
    platform: SocialPlatform,
    tenantId: string = this.tenantId,
    clientUserId: string = "demo_client_user"
  ): string {
    const platformRoute = platform.toLowerCase();
    return `${this.gatewayUrl}/v1/auth/${platformRoute}/login?tenant_id=${encodeURIComponent(
      tenantId
    )}&client_user_id=${encodeURIComponent(clientUserId)}`;
  }

  // Lists all connected social accounts, optionally filtered by user ID
  public async getAccounts(clientUserId?: string): Promise<SocialAccount[]> {
    const query = clientUserId ? `?client_user_id=${encodeURIComponent(clientUserId)}` : "";
    const res = await this.request<SocialAccount[]>(`/v1/accounts${query}`, {
      method: "GET",
      cache: "no-store",
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // Disconnects / deactivates a connected social account
  public async disconnectAccount(accountId: string): Promise<{ success: boolean }> {
    const res = await this.request<{ success: boolean }>(`/v1/accounts/${accountId}/disconnect`, {
      method: "POST",
    });
    return res.data;
  }

  // Enqueues and schedules a post through the Gateway
  public async createPost(input: CreatePostInput): Promise<{ success: boolean; data: Post }> {
    const res = await this.request<{ success: boolean; data: Post }>("/v1/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return res.data;
  }

  // Fetches current processing/publication status of a specific post
  public async getPostStatus(postId: string): Promise<Post> {
    const res = await this.request<Post>(`/v1/posts/${postId}`, {
      method: "GET",
      cache: "no-store",
    });
    return res.data;
  }

  // Lists recent posts processed or queued by the gateway
  public async listPosts(tenantId: string = this.tenantId): Promise<Post[]> {
    const query = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : "";
    const res = await this.request<Post[]>(`/v1/posts${query}`, {
      method: "GET",
      cache: "no-store",
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  // Uploads media (images/videos) directly to the gateway uploads endpoint
  public async uploadMedia(file: File): Promise<{ status: string; url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await this.request<{ status: string; url: string; filename: string }>("/v1/upload", {
      method: "POST",
      body: formData,
    });
    return res.data;
  }

  // Checks connectivity / health of the gateway endpoint
  public async checkHealth(): Promise<{ ok: boolean; statusText: string; latencyMs: number }> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.gatewayUrl}/`, {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: response.status < 500,
        statusText: response.statusText || `${response.status} OK`,
        latencyMs,
      };
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      return {
        ok: false,
        statusText: "Sin conexión con la pasarela",
        latencyMs,
      };
    }
  }
}

// Singleton default client instance
export const obGateway = new OBGatewayClient();
