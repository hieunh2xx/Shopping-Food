import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ChefHat, Search, ClipboardList } from 'lucide-react';
import { useAuth } from '../../hooks';
import { CartDrawer } from './CartDrawer';
import { NotificationBell } from './NotificationBell';
import { ROUTES } from '../../routes/routeConfig';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Shopping Food
            </span>
          </Link>

          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Tìm kiếm món ăn, nhà hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <Search className="absolute left-4 top-[11px] w-4 h-4 text-gray-400" />
            </form>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="flex items-center">
              {isAuthenticated ? (
                <>
                  {/* Order Tracking */}
                  <Link
                    to={ROUTES.GUEST_ORDER_TRACKING}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/50 transition-colors text-sm font-medium text-gray-700"
                    title="Tra cứu đơn hàng"
                  >
                    <ClipboardList className="w-5 h-5 text-gray-600" />
                    <span className="hidden xl:block">Tra cứu đơn</span>
                  </Link>

                  {/* Cart */}
                  <CartDrawer />

                  {/* Notifications */}
                  <NotificationBell />

                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/50 transition-colors">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.fullName || user.userName} 
                          className="w-8 h-8 rounded-full object-cover border border-orange-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <span className="hidden sm:block text-sm font-medium text-gray-700">
                        {user?.fullName || user?.userName}
                      </span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-1 w-48 py-2 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                      {user?.role === 'Admin' && (
                        <Link
                          to={ROUTES.ADMIN_DASHBOARD}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          Quản trị hệ thống
                        </Link>
                      )}
                      {user?.role === 'Seller' && (
                        <Link
                          to={ROUTES.SELLER_DASHBOARD}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          Quản lý cửa hàng
                        </Link>
                      )}
                      {user?.role === 'Shipper' && (
                        <Link
                          to={ROUTES.SHIPPER_DASHBOARD}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          Kênh tài xế
                        </Link>
                      )}
                      {user?.role === 'Customer' && (
                        <Link
                          to={ROUTES.SELLER_APPLY}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          Đăng ký thành người bán
                        </Link>
                      )}
                      {user?.role === 'Customer' && (
                        <>
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          >
                            Hồ sơ cá nhân
                          </Link>
                          <Link
                            to="/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          >
                            Đơn hàng của tôi
                          </Link>
                          <div className="h-px bg-gray-100 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to={ROUTES.GUEST_ORDER_TRACKING}
                    className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/50 transition-colors text-sm font-medium text-gray-700"
                    title="Tra cứu đơn hàng"
                  >
                    <ClipboardList className="w-5 h-5 text-gray-600" />
                    <span className="hidden xl:block">Tra cứu đơn</span>
                  </Link>
                  <CartDrawer />
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="hidden sm:flex px-4 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
