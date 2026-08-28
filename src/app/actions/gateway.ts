"use server";

import { OBGatewayClient } from "@/lib/gateway-client";
import { CreatePostInput, Post, SocialAccount } from "@/lib/types";
import { revalidatePath } from "next/cache";

function getClient(gatewayUrl?: string, apiKey?: string, tenantId?: string) {
  return new OBGatewayClient({
    gatewayUrl,
    apiKey,
    tenantId,
  });
}

export async function fetchAccountsAction(
  config?: { gatewayUrl?: string; apiKey?: string; tenantId?: string },
  clientUserId?: string
): Promise<{ success: boolean; data: SocialAccount[]; error?: string }> {
  try {
    const client = getClient(config?.gatewayUrl, config?.apiKey, config?.tenantId);
    const accounts = await client.getAccounts(clientUserId);
    return { success: true, data: accounts };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Error al obtener cuentas desde la pasarela",
    };
  }
}

export async function disconnectAccountAction(
  accountId: string,
  config?: { gatewayUrl?: string; apiKey?: string; tenantId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient(config?.gatewayUrl, config?.apiKey, config?.tenantId);
    await client.disconnectAccount(accountId);
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al desconectar cuenta",
    };
  }
}

export async function submitPostAction(
  input: CreatePostInput,
  config?: { gatewayUrl?: string; apiKey?: string; tenantId?: string }
): Promise<{ success: boolean; data?: Post; error?: string }> {
  try {
    const client = getClient(config?.gatewayUrl, config?.apiKey, config?.tenantId);
    const res = await client.createPost(input);
    revalidatePath("/");
    return { success: true, data: res.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al enviar publicación a la pasarela",
    };
  }
}

export async function fetchPostStatusAction(
  postId: string,
  config?: { gatewayUrl?: string; apiKey?: string; tenantId?: string }
): Promise<{ success: boolean; data?: Post; error?: string }> {
  try {
    const client = getClient(config?.gatewayUrl, config?.apiKey, config?.tenantId);
    const post = await client.getPostStatus(postId);
    return { success: true, data: post };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al consultar estado del post",
    };
  }
}

export async function fetchPostsListAction(
  config?: { gatewayUrl?: string; apiKey?: string; tenantId?: string }
): Promise<{ success: boolean; data: Post[]; error?: string }> {
  try {
    const client = getClient(config?.gatewayUrl, config?.apiKey, config?.tenantId);
    const posts = await client.listPosts(config?.tenantId);
    return { success: true, data: posts };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Error al obtener historial de publicaciones",
    };
  }
}

export async function checkGatewayHealthAction(gatewayUrl?: string): Promise<{
  ok: boolean;
  statusText: string;
  latencyMs: number;
}> {
  const client = getClient(gatewayUrl);
  return await client.checkHealth();
}
