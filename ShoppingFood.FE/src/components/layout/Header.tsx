import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, ChefHat, Search } from 'lucide-react';
import { useAuth } from '../../hooks';
import { CartDrawer } from './CartDrawer';
import { ROUTES } from '../../routes/routeConfig';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.PRODUCTS}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                <ChefHat className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent hidden sm:block">
                Shopping Food
              </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="TÃ¬m mÃ³n Äƒn, nhÃ  hÃ ng..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100/50 border border-gray-300/50 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30 transition-all"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link
                to={ROUTES.PRODUCTS}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 transition-colors hidden sm:block"
              >
                Thá»±c Ä‘Æ¡n
              </Link>

              {isAuthenticated ? (
                <>
                  {/* Cart */}
                  <CartDrawer />

                  {/* User Menu */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100/50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-900" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden lg:block">
                        {user?.fullName || user?.userName}
                      </span>
                    </button>

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-1 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5">
                        <div className="px-3 py-2 border-b border-gray-200 mb-1">
                          <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
                          <p className="text-xs text-gray-500">{user?.role}</p>
                        </div>

                        {user?.role === 'Seller' && (
                          <Link
                            to={ROUTES.SELLER_DASHBOARD}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <ChefHat className="w-4 h-4" />
                            Quáº£n lÃ½ cá»­a hÃ ng
                          </Link>
                        )}

                        {user?.role === 'Admin' && (
                          <Link
                            to={ROUTES.ADMIN_DASHBOARD}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Quáº£n trá»‹ há»‡ thá»‘ng
                          </Link>
                        )}

                        <button
                          onClick={logout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          ÄÄƒng xuáº¥t
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <CartDrawer />
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 transition-colors"
                  >
                    ÄÄƒng nháº­p
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-gray-900 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all"
                  >
                    ÄÄƒng kÃ½
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
