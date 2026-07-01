import type { IUserDto } from '../interfaces';

const TOKEN_KEY = 'sf_token';
const USER_KEY = 'sf_user';

/**
 * LocalStorage utility — SRP: only handles storage operations
 */
export class StorageUtil {
  private static normalizeToken(token: string): string {
    return token.trim().replace(/^Bearer\s+/i, '').trim();
  }

  static isJwtToken(token: string | null): token is string {
    if (!token) return false;
    const normalized = this.normalizeToken(token);
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalized);
  }

  static getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!this.isJwtToken(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return this.normalizeToken(token);
  }

  static setToken(token: string): void {
    if (!this.isJwtToken(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    localStorage.setItem(TOKEN_KEY, this.normalizeToken(token));
  }

  static getUser(): IUserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IUserDto;
    } catch {
      return null;
    }
  }

  static setUser(user: IUserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return this.isJwtToken(this.getToken());
  }
}
