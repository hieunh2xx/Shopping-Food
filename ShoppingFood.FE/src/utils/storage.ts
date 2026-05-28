import type { IUserDto } from '../interfaces';

const TOKEN_KEY = 'sf_token';
const REFRESH_TOKEN_KEY = 'sf_refresh_token';
const USER_KEY = 'sf_user';

/**
 * LocalStorage utility — SRP: only handles storage operations
 */
export class StorageUtil {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
