import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services';
import toast from 'react-hot-toast';

// Mock dependecies
vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));

vi.mock('../../services', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    sendLoginOtp: vi.fn(),
    verifyLoginOtp: vi.fn(),
    verifyUnlockAccount: vi.fn(),
    sendOtp: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAuth Hook', () => {
  const mockCtxLogin = vi.fn();
  const mockCtxLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthContext as any).mockReturnValue({
      login: mockCtxLogin,
      logout: mockCtxLogout,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('should call login success and update context when credentials are correct', async () => {
    (authService.login as any).mockResolvedValue({
      error: false,
      message: 'Success',
      data: {
        token: 'mock-token',
        username: 'testuser',
        role: 'Customer',
      },
    });

    const { result } = renderHook(() => useAuth());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({ userName: 'testuser', password: 'password' });
    });

    expect(loginResult).toEqual({ success: true, requireOtp: false });
    expect(mockCtxLogin).toHaveBeenCalledWith('mock-token', expect.objectContaining({
      userName: 'testuser',
      role: 'Customer',
    }));
    expect(toast.success).toHaveBeenCalledWith('Đăng nhập thành công!');
  });

  it('should return error when login service fails', async () => {
    (authService.login as any).mockResolvedValue({
      error: true,
      message: 'Incorrect password',
    });

    const { result } = renderHook(() => useAuth());

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login({ userName: 'testuser', password: 'wrongpassword' });
    });

    expect(loginResult).toEqual({ success: false });
    expect(mockCtxLogin).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Incorrect password');
  });
});
