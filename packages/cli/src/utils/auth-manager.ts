import { getCredentialAccount } from './config';

export class AuthManager {
  private static instance: AuthManager;
  private readonly service: string = 'compify-cli';

  private get account(): string {
    return getCredentialAccount();
  }

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async setToken(token: string): Promise<void> {
    await Bun.secrets.set({
      service: this.service,
      name: this.account,
      value: token,
    });
  }

  async getToken(): Promise<string | null> {
    if (process.env.COMPIFY_TOKEN) return process.env.COMPIFY_TOKEN;
    return await Bun.secrets.get({
      service: this.service,
      name: this.account,
    });
  }

  async deleteToken(): Promise<boolean> {
    return await Bun.secrets.delete({
      service: this.service,
      name: this.account,
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}
