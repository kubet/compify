import fetch from 'node-fetch';
import { AuthManager } from './auth-manager';
import { logger } from './logger';

import { getApiUrl } from './config';

// COMPIFY_API_URL and the global --api-url option select a self-hosted server.
const getBaseUrl = () => `${getApiUrl()}/cli`;
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