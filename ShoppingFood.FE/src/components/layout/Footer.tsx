import { ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { useAuth } from '../../hooks';

export function Footer() {
  const { isAuthenticated, user } = useAuth();

  const getPartnerRoute = () => {
    if (isAuthenticated && user?.role === 'Customer') {
      return ROUTES.SELLER_APPLY;
    }
    return ROUTES.REGISTER_SELLER;
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Shopping Food
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Nền tảng đặt và giao nhận đồ ăn trực tuyến hàng đầu Việt Nam.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Khám phá</h4>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Thực đơn
                </Link>
              </li>
              <li>
                <Link to={ROUTES.RESTAURANTS} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Nhà hàng
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PROMOTIONS} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Đối tác</h4>
            <ul className="space-y-2">
              <li>
                <Link to={getPartnerRoute()} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Đăng ký bán hàng
                </Link>
              </li>
              <li>
                <Link to={ROUTES.REGISTER_SHIPPER} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Trở thành tài xế
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.HELP_CENTER} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to={ROUTES.TERMS_OF_USE} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRIVACY_POLICY} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Shopping Food. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
