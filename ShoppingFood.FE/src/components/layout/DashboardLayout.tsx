import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks';
import { NotificationBell } from './NotificationBell';

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  group?: string;
  badge?: number | boolean;
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

/**
 * Thành phần Nhóm Menu Điều hướng có thể thu gọn (Accordion Nav Group).
 * Tự động mở nhóm nếu có mục con đang hoạt động.
 */
function NavGroupDropdown({ 
  groupName, 
  items, 
  location, 
  setIsSidebarOpen 
}: { 
  groupName: string, 
  items: NavItem[], 
  location: any, 
  setIsSidebarOpen: any 
}) {
  const isAnyActive = items.some(item => location.pathname === item.path);
  const [isOpen, setIsOpen] = useState(isAnyActive || !groupName);

  return (
    <div className="space-y-1">
      {groupName && (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>{groupName}</span>
            {items.some(item => item.badge) && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </div>
          {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      )}
      {isOpen && (
        <div className="space-y-1 pl-1">
          {items.map((item) => {
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
                <item.icon className={`w-5 h-5 ${isExactMatch ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                <span className="flex-1">{item.name}</span>
                {!!item.badge && (
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Layout Khung Điều khiển Quản trị dùng chung (DashboardLayout).
 * Cung cấp khung giao diện Dashboard chuẩn gồm Sidebar trái (thu gọn trên mobile, gom nhóm điều hướng), Header trên (chuông thông báo, tài khoản) và khu vực nội dung (Outlet).
 * Dùng cho các phân hệ: Admin, Coordinator, Seller, Shipper.
 */
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {(() => {
            const groupedItems = navItems.reduce((acc, item) => {
              const groupName = item.group || '';
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(item);
              return acc;
            }, {} as Record<string, NavItem[]>);

            return Object.entries(groupedItems).map(([groupName, items]) => (
              <NavGroupDropdown 
                key={groupName}
                groupName={groupName}
                items={items}
                location={location}
                setIsSidebarOpen={setIsSidebarOpen}
              />
            ));
          })()}
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
            <NotificationBell />
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