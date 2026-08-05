import keytar from 'keytar';

export class AuthManager {
  private static instance: AuthManager;
  private readonly service: string = 'compify-cli';
  private readonly account: string = 'default';

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async setToken(token: string): Promise<void> {
    await keytar.setPassword(this.service, this.account, token);
  }

  async getToken(): Promise<string | null> {
    return await keytar.getPassword(this.service, this.account);
  }

  async deleteToken(): Promise<boolean> {
    return await keytar.deletePassword(this.service, this.account);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
} 