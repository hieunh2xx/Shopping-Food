import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, ChefHat, Search, MapPin, ChevronDown, MessageSquare } from 'lucide-react';
import { useAuth, useUserLocation, useCustomerChatWatcher } from '../../hooks';
import { ShoppingDrawer } from './ShoppingDrawer';
import { NotificationBell } from './NotificationBell';
import { ROUTES } from '../../routes/routeConfig';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { address, fullAddress, isLoading: isLocationLoading } = useUserLocation();
  const { unreadCount: unreadChatCount } = useCustomerChatWatcher();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Keep empty or remove entirely as track=true is handled in ShoppingDrawer
  }, [location.search]);

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
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <ChefHat className="w-6 h-6 text-gray-900" />
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                UniEats
              </span>
            </Link>

            {/* Location Pill */}
            <div className="hidden lg:block relative group ml-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  {isLocationLoading ? "Đang định vị..." : address}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:rotate-180 transition-transform duration-200" />
              </div>

              {/* Dropdown Menu */}
              {!isLocationLoading && fullAddress && (
                <div className="absolute left-0 top-full mt-2 w-72 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Vị trí hiện tại</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {fullAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                    {/* Shopping (Cart & Orders) */}
                    <ShoppingDrawer />

                    {/* Messages (Customer) */}
                    {user?.role === 'Customer' && (
                      <Link
                        to={ROUTES.MESSAGES}
                        className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        title="Tin nhắn"
                      >
                        <MessageSquare className="w-5 h-5" />
                        {unreadChatCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {unreadChatCount > 99 ? '99+' : unreadChatCount}
                          </span>
                        )}
                      </Link>
                    )}

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
                        {user?.role === 'Coordinator' && (
                          <Link
                            to={ROUTES.COORDINATOR_DISPATCH}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          >
                            Kênh điều phối
                          </Link>
                        )}
                        {(user?.role === 'Seller' || user?.role === 'Mall') && (
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
                              to={ROUTES.MESSAGES}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                            >
                              Tin nhắn
                            </Link>
                            <Link
                              to={`${ROUTES.PROFILE}?tab=applications`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                            >
                              Lịch sử đăng ký
                            </Link>
                            <Link
                              to="/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                            >
                              Hồ sơ cá nhân
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
                    <ShoppingDrawer />
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

    </>
  );
}
