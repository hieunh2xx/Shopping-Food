import { type Configuration, PublicClientApplication } from "@azure/msal-browser";

/**
 * Cấu hình thư viện Microsoft Authentication Library (MSAL) để hỗ trợ đăng nhập Single Sign-On (SSO) tài khoản Microsoft.
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: "b415c1cf-f993-460a-894d-66a9f5b109b5",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", 
  },
};

/** Đối tượng khởi tạo PublicClientApplication của MSAL */
export const msalInstance = new PublicClientApplication(msalConfig);

/** Cấu hình phạm vi quyền (scopes) yêu cầu khi người dùng đăng nhập tài khoản Microsoft */
export const loginRequest = {
  scopes: ["User.Read"],
};
