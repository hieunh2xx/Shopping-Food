import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ENV } from './config/env';

// ─── Phát hiện Callback đăng nhập Microsoft OAuth ───────────────────────────
// Khi Microsoft chuyển hướng về nguồn gốc với tham số ?code=...,
// tiến trình popup này sẽ bắt mã TRƯỚC KHI React kết xuất,
// gửi mã xác thực về cửa sổ cha (parent window), sau đó tự đóng popup.
const urlParams = new URLSearchParams(window.location.search);
const msCode = urlParams.get('code');
const msState = urlParams.get('state');

if (msCode && msState?.startsWith('ms_login_') && window.opener) {
  // Đang ở trong cửa sổ popup vừa nhận được mã ủy quyền từ Microsoft
  window.opener.postMessage(
    { type: 'microsoft-auth-code', code: msCode },
    window.location.origin
  );
  window.close();
} else {
  // Khởi tạo và render ứng dụng React thông thường
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || "942017134751-6vknm1m8rtmob6ie2i3cqrt7oitl2mpc.apps.googleusercontent.com"}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>,
  );
}

