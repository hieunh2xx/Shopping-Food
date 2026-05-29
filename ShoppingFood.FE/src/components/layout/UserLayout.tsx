import { Outlet, NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { User, ShoppingBag, Store } from 'lucide-react';
import { useAuth } from '../../hooks';

export function UserLayout() {
  const { user } = useAuth();

  const navItems = [
    { name: 'Hồ sơ cá nhân', path: ROUTES.PROFILE, icon: <User className="w-5 h-5" /> },
    { name: 'Đơn hàng của tôi', path: ROUTES.ORDERS, icon: <ShoppingBag className="w-5 h-5" /> },
  ];

  if (user?.role === 'Customer') {
    navItems.push({ name: 'Đăng ký bán hàng', path: ROUTES.SELLER_APPLY, icon: <Store className="w-5 h-5" /> });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">Tài khoản của tôi</h2>
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
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
