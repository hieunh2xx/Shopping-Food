import { ChefHat } from 'lucide-react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

interface RegisterPageProps {
  isSeller?: boolean;
}

export function RegisterPage({ isSeller = false }: RegisterPageProps) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left â€” Decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-gray-950 to-gray-950" />
        <div className="absolute top-32 left-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20">
              <ChefHat className="w-7 h-7 text-gray-900" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Shopping Food</span>
          </Link>

          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            {isSeller ? (
              <>
                Trở thành
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  đối tác bán hàng
                </span>
              </>
            ) : (
              <>
                Tham gia
                <br />
                <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  cộng đồng ẩm thực
                </span>
              </>
            )}
          </h2>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            {isSeller
              ? 'Tiếp cận hàng triệu khách hàng, quản lý đơn hàng dễ dàng và tăng doanh thu.'
              : 'Đăng ký ngay để nhận ưu đãi cho người dùng mới và trải nghiệm đặt hàng nhanh chóng.'
            }
          </p>
        </div>
      </div>

      {/* Right â€” Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Shopping Food
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isSeller ? 'Đăng ký đối tác' : 'Tạo tài khoản'}
            </h1>
            <p className="text-sm text-gray-500">
              {isSeller ? 'Điền thông tin để bắt đầu bán hàng' : 'Điền thông tin cá nhân để bắt đầu'}
            </p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8">
            <RegisterForm isSeller={isSeller} />
          </div>
        </div>
      </div>
    </div>
  );
}
