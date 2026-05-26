import type { IUserDto } from './IUser';

/**
 * Auth state in context
 */
export interface IAuthState {
  user: IUserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Auth context value
 */
export interface IAuthContext extends IAuthState {
  login: (token: string, user: IUserDto) => void;
  logout: () => void;
  updateUser: (user: IUserDto) => void;
}
