import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * Cấu hình kết nối Firebase Authentication và Firebase Services.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Khởi tạo ứng dụng Firebase Client
const app = initializeApp(firebaseConfig);

// Khởi tạo và xuất đối tượng xác thực Firebase Auth (dùng cho xác thực số điện thoại OTP Firebase)
export const auth = getAuth(app);

// Mở rộng giao diện Window để lưu trữ RecaptchaVerifier của Firebase phone auth
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
