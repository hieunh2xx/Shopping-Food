import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { IAuthContext, IUserDto } from '../interfaces';
import { StorageUtil } from '../utils/storage';

/**
 * Auth Context — DIP (Dependency Inversion)
 * Components depend on this context abstraction, not concrete services
 */
const AuthContext = createContext<IAuthContext | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider — manages authentication state globally
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore auth state from localStorage on mount
  useEffect(() => {
    const savedToken = StorageUtil.getToken();
    const savedUser = StorageUtil.getUser();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: IUserDto) => {
    setToken(newToken);
    setUser(newUser);
    StorageUtil.setToken(newToken);
    StorageUtil.setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    StorageUtil.clearAuth();
  }, []);

  const updateUser = useCallback((updatedUser: IUserDto) => {
    setUser(updatedUser);
    StorageUtil.setUser(updatedUser);
  }, []);

  const value: IAuthContext = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context — throws if used outside provider
 */
export function useAuthContext(): IAuthContext {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
