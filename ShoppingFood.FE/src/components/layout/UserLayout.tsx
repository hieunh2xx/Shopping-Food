import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { User, ShoppingBag, Store, Heart, MapPin, LogOut, Ticket, Award, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks';
import { Header } from './Header';
import { Footer } from './Footer';

export function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isProfileTab = (tab: string) => {
    const search = new URLSearchParams(location.search);
    if (tab === 'info' && (!search.get('tab') || search.get('tab') === 'info') && location.pathname === ROUTES.PROFILE) return true;
    return search.get('tab') === tab && location.pathname === ROUTES.PROFILE;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Tài khoản của tôi</h2>
            <nav className="flex flex-col space-y-1">
              <NavLink
                to={`${ROUTES.PROFILE}?tab=info`}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isProfileTab('info') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <User className="w-5 h-5" /> Hồ sơ cá nhân
              </NavLink>

              <NavLink
                to={`${ROUTES.PROFILE}?tab=favorites`}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isProfileTab('favorites') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Heart className="w-5 h-5" /> Quán ăn yêu thích
              </NavLink>
              <NavLink
                to={`${ROUTES.PROFILE}?tab=address`}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isProfileTab('address') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <MapPin className="w-5 h-5" /> Sổ địa chỉ
              </NavLink>
              <NavLink
                to={`${ROUTES.PROFILE}?tab=vouchers`}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isProfileTab('vouchers') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Ticket className="w-5 h-5" /> Ví Voucher
              </NavLink>
              <NavLink
                to={`${ROUTES.PROFILE}?tab=loyalty`}
                className={() =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isProfileTab('loyalty') ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Award className="w-5 h-5" /> Điểm thưởng
              </NavLink>

              <div className="my-2 border-t border-gray-100"></div>
              
              {user?.role === 'Customer' && (
                <>
                  <NavLink
                    to={ROUTES.SELLER_APPLY as string}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                        isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <Store className="w-5 h-5" /> Đăng ký bán hàng
                  </NavLink>
                  <NavLink
                    to={ROUTES.SHIPPER_APPLY as string}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                        isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Đăng ký giao hàng
                  </NavLink>
                </>
              )}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-red-600 hover:bg-red-50 text-sm"
              >
                <LogOut className="w-5 h-5" /> Đăng xuất
              </button>
            </nav>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
