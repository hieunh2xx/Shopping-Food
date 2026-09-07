import { ChefHat } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

/**
 * Trang Đăng Nhập Tài Khoản (LoginPage).
 * Cung cấp giao diện đăng nhập đa phương thức:
 * - Đăng nhập tài khoản / mật khẩu có hỗ trợ xác thực 2FA OTP
 * - Đăng nhập bằng Google OAuth và Microsoft SSO
 * - Đăng nhập nhanh bằng số điện thoại OTP Firebase.
 */
export function LoginPage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Cột trái — Đồ họa và lời chào mừng */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">

        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-gray-50 to-gray-50" />
        <div className="absolute top-32 left-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-12 group cursor-pointer hover:scale-105 transition-transform w-fit">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20">
              <ChefHat className="w-7 h-7 text-gray-900" />
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">UniEats</span>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            Chào mừng trở lại!
            <br />
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Hôm nay bạn muốn ăn gì?
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            Đăng nhập để đặt món dễ dàng, theo dõi đơn hàng và nhận những ưu đãi hấp dẫn dành riêng cho bạn.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                  <span className="text-xl">👩‍🍳</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Tham gia cùng <span className="text-orange-600">+10,000</span> khách hàng
            </p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              UniEats
            </span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p className="text-sm text-gray-500">
              Vui lòng điền thông tin để tiếp tục
            </p>
          </div>

          <div className="bg-white/80  border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
