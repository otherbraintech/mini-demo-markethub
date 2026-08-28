export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN';

export type PostStatus = 
  | 'PENDING'
  | 'DOWNLOADING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'UPLOADING'
  | 'AWAITING_WEBHOOK'
  | 'PUBLISHED'
  | 'FAILED';

export type PostType = 'VIDEO' | 'IMAGE' | 'TEXT';

export interface SocialAccount {
  id: string;
  tenant_id: string;
  client_user_id: string;
  platform: SocialPlatform;
  platform_account_id: string;
  platform_username: string;
  platform_avatar_url?: string | null;
  is_active: boolean;
  business_info?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  tenant_id: string;
  social_account_id: string;
  media_url: string;
  caption: string;
  hashtags?: string[] | null;
  post_type: PostType;
  status: PostStatus;
  publish_id?: string | null;
  error_message?: string | null;
  retry_count: number;
  max_retries: number;
  scheduled_at?: string | null;
  processed_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  tenant_id: string;
  social_account_id: string;
  media_url: string;
  caption: string;
  hashtags?: string[];
  post_type: PostType;
  scheduled_at?: string | null;
}

export interface GatewayConfig {
  gatewayUrl: string;
  apiKey: string;
  tenantId: string;
  clientUserId: string;
}

export interface ApiTrafficEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'DELETE' | 'OPTIONS';
  endpoint: string;
  status: number;
  durationMs: number;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

export interface OAuthCallbackPayload {
  type: string;
  platform: string;
  username?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    tenant_id: string;
    client_user_id: string;
  };
  fb_pages_count?: number;
  ig_count?: number;
}
