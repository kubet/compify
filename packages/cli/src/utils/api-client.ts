import fetch from 'node-fetch';
import { AuthManager } from './auth-manager';
import { logger } from './logger';

import { getApiUrl } from './config';

// COMPIFY_API_URL and the global --api-url option select a self-hosted server.
const getBaseUrl = () => `${getApiUrl()}/cli`;

export interface PublishStoryRequest {
  schemaVersion: 1;
  name: string;
  description?: string;
  publishingName: string;
  visibility: "public" | "private" | "unlisted";
  language: "tsx" | "jsx" | "ts" | "js";
  entry: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  stories: Array<{ exportName: string; name: string; args?: unknown; portable: boolean }>;
  provenance: { storyPath: string; gitCommit?: string; gitRemote?: string };
  digest: string;
}


export interface PublishStoryResponse {
  componentId: string;
  publishingDomain: string;
  digest: string;
  registryUrl: string | null;
  previewUrl: string;
}

export interface ComponentResponse {
  id: string;
  name: string;
  language: string;
  usedUiFrameworks?: string[];
  files: Record<string, string>;
}

export class ApiClient {
  private static instance: ApiClient;
  private authManager: AuthManager;

  private constructor() {
    this.authManager = AuthManager.getInstance();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.authManager.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['x-cli-token'] = token;
    }
    return headers;
  }

  async getComponent(componentName: string): Promise<ComponentResponse> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${getBaseUrl()}/get?id=${encodeURIComponent(componentName)}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login first.');
        }
        throw new Error(`Failed to fetch component: ${response.statusText}`);
      }

      return await response.json() as ComponentResponse;
    } catch (error) {
      logger.error('Failed to fetch component', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getComponents(): Promise<ComponentResponse[]> {
    const headers = await this.getHeaders();
    const response = await fetch(`${getBaseUrl()}/get-all`, { headers });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please login first.');
      }
      throw new Error(`Failed to fetch components: ${response.status} ${response.statusText}`);
    }
    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('Registry returned an invalid component list');
    }
    return body as ComponentResponse[];
  }

  async publishStory(payload: PublishStoryRequest): Promise<PublishStoryResponse> {
    const token = await this.authManager.getToken();
    if (!token) throw new Error('Authentication required. Please login first.');
    const response = await fetch(`${getBaseUrl()}/publish-story`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication required. Please login first.');
      let details = response.statusText;
      try {
        const body = await response.json() as any;
        details = body?.error || body?.message || details;
      } catch {}
      throw new Error(`Failed to publish story: ${response.status} ${details}`);
    }
    return await response.json() as PublishStoryResponse;
  }

  async validateToken(token: string): Promise<void> {
    const response = await fetch(`${getBaseUrl()}/get-all`, {
      headers: { 'x-cli-token': token },
    });
    if (!response.ok) {
      throw new Error(response.status === 401
        ? 'Invalid CLI token'
        : `Could not validate token: ${response.status} ${response.statusText}`);
    }
  }
} 