import fetch from 'node-fetch';
import { AuthManager } from './auth-manager';
import { logger } from './logger';

// const BASE_URL = 'https://api.compify.app/cli';
const BASE_URL = 'http://localhost:3009/cli';
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
      const response = await fetch(`${BASE_URL}/get?id=${componentName}`, {
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
    const response = await fetch(`${BASE_URL}/get-all`, { headers });
    return await response.json() as ComponentResponse[];
  }
} 