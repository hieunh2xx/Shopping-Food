import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ENV } from './config/env';

// ─── Microsoft OAuth Callback Detection ────────────────────────────
// When Microsoft redirects back to our origin with ?code=..., 
// this popup instance detects it BEFORE React renders,
// sends the code to the parent window, and closes itself.
const urlParams = new URLSearchParams(window.location.search);
const msCode = urlParams.get('code');
const msState = urlParams.get('state');

if (msCode && msState?.startsWith('ms_login_') && window.opener) {
  // We're in a popup that just received Microsoft's auth code
  window.opener.postMessage(
    { type: 'microsoft-auth-code', code: msCode },
    window.location.origin
  );
  window.close();
} else {
  // Normal app rendering
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID || "942017134751-6vknm1m8rtmob6ie2i3cqrt7oitl2mpc.apps.googleusercontent.com"}>
        <App />
      </GoogleOAuthProvider>
    </StrictMode>,
  );
}
