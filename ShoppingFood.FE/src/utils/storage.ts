import type { IUserDto } from '../interfaces';

const TOKEN_KEY = 'sf_token';
const USER_KEY = 'sf_user';

/**
 * Tiện ích quản trị lưu trữ cục bộ LocalStorage (Tuân thủ nguyên lý SRP: chỉ chuyên trách đọc/ghi Storage).
 */
export class StorageUtil {
  /**
   * Chuẩn hóa chuỗi token xác thực, loại bỏ tiền tố 'Bearer ' nếu có và khoảng trắng thừa.
   * @param token - Chuỗi JWT token
   * @returns Chuỗi token sạch
   */
  private static normalizeToken(token: string): string {
    return token.trim().replace(/^Bearer\s+/i, '').trim();
  }

  /**
   * Kiểm tra xem chuỗi có đúng định dạng cấu trúc JWT gồm 3 phần header.payload.signature hay không.
   * @param token - Chuỗi cần kiểm tra
   * @returns true nếu chuỗi đúng cấu trúc JWT, ngược lại false
   */
  static isJwtToken(token: string | null): token is string {
    if (!token) return false;
    const normalized = this.normalizeToken(token);
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalized);
  }

  /**
   * Lấy JWT token xác thực từ LocalStorage. Nếu token không hợp lệ sẽ tự động xóa và trả về null.
   * @returns Chuỗi token xác thực hoặc null nếu chưa đăng nhập
   */
  static getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!this.isJwtToken(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return this.normalizeToken(token);
  }

  /**
   * Lưu JWT token xác thực vào LocalStorage.
   * @param token - Chuỗi JWT token cần lưu
   */
  static setToken(token: string): void {
    if (!this.isJwtToken(token)) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    localStorage.setItem(TOKEN_KEY, this.normalizeToken(token));
  }

  /**
   * Lấy thông tin đối tượng người dùng hiện tại đã lưu trong LocalStorage.
   * @returns Đối tượng IUserDto hoặc null nếu chưa có/dữ liệu lỗi
   */
  static getUser(): IUserDto | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as IUserDto;
    } catch {
      return null;
    }
  }

  /**
   * Lưu thông tin đối tượng người dùng vào LocalStorage dưới dạng chuỗi JSON.
   * @param user - Đối tượng thông tin người dùng
   */
  static setUser(user: IUserDto): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Xóa toàn bộ thông tin phiên xác thực (token và user) khỏi LocalStorage khi đăng xuất.
   */
  static clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Kiểm tra nhanh trạng thái người dùng đã đăng nhập hay chưa (dựa trên sự tồn tại của JWT token hợp lệ).
   * @returns true nếu người dùng đã xác thực, ngược lại false
   */
  static isAuthenticated(): boolean {
    return this.isJwtToken(this.getToken());
  }
}
