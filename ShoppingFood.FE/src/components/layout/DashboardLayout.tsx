import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

export interface DashboardLayoutProps {
  navItems: NavItem[];
  brandName: string;
  brandIcon: React.ElementType;
  brandPath?: string;
  userRoleName: string;
  onLogout: () => void;
  extraAction?: React.ReactNode;
  globalBanner?: React.ReactNode;
}

export function DashboardLayout({
  navItems,
  brandName,
  brandIcon: BrandIcon,
  brandPath = '/',
  userRoleName,
  onLogout,
  extraAction,
  globalBanner,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 h-full bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <Link to={brandPath} className="h-16 flex items-center gap-3 px-6 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <BrandIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">{brandName}</span>
          <button 
            className="lg:hidden ml-auto text-gray-500 hover:text-gray-900"
            onClick={(e) => {
              e.preventDefault();
              setIsSidebarOpen(false);
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            // Allow active highlight for exact match or nested paths, though exact match logic might need refinement depending on actual paths.
            // A simple exact match is safest for top-level navigation:
            const isExactMatch = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors
                  ${isExactMatch 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isExactMatch ? 'text-orange-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          {extraAction && (
            <div className="mb-2">
              {extraAction}
            </div>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
              {navItems.find(item => item.path === location.pathname)?.name || brandName}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500">{userRoleName}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                <span className="text-orange-600 font-bold">{user?.fullName?.charAt(0) || userRoleName.charAt(0)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {globalBanner}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}