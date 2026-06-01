import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../../pages/LoginPage';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../hooks';

// Mock dependencies
vi.mock('../../hooks', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleLogin: () => <div data-testid="mock-google-login">Mock Google Login</div>,
}));

vi.mock('../../config/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  RecaptchaVerifier: vi.fn().mockImplementation(function() {
    return {};
  }),
  signInWithPhoneNumber: vi.fn(),
}));

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();
  const mockSendLoginOtp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      sendLoginOtp: mockSendLoginOtp,
      isLoading: false,
      user: null,
      isAuthenticated: false,
    });
  });

  it('renders login form items successfully', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Checks that the "Đăng nhập" page title and username input are rendered
    expect(screen.getAllByText('Đăng nhập')).toBeDefined();
    expect(screen.getByPlaceholderText('Nhập tên đăng nhập hoặc email')).toBeDefined();
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeDefined();
  });

  it('triggers validation when submitting empty fields', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: 'Đăng nhập' });
    fireEvent.click(submitBtn);

    // Expecting error messages
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập tên đăng nhập')).toBeDefined();
      expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeDefined();
    });
  });

  it('calls login function on valid input submission', async () => {
    mockLogin.mockResolvedValue({ success: true, requireOtp: false });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText('Nhập tên đăng nhập hoặc email');
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu');
    const submitBtn = screen.getByRole('button', { name: 'Đăng nhập' });

    fireEvent.change(usernameInput, { target: { value: 'user123' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ userName: 'user123', password: 'pass123' });
    });
  });
});
