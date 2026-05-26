import { useState } from 'react';
import { Layout, Database, Check, ShieldCheck, Search, Users } from 'lucide-react';
import { Button, Input } from '../../components/common';

type Role = { id: string; name: string; description: string; userCount: number; color: string };
type PermissionItem = { id: string; name: string; description: string };
type PermissionGroup = { id: string; title: string; type: 'UI' | 'API'; items: PermissionItem[] };

const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Quản trị viên cấp cao, toàn quyền truy cập hệ thống.', userCount: 3, color: 'bg-purple-500' },
  { id: 'r2', name: 'Seller', description: 'Đối tác bán hàng, quản lý cửa hàng và đơn hàng.', userCount: 156, color: 'bg-blue-500' },
  { id: 'r3', name: 'Customer', description: 'Khách hàng tiêu chuẩn, truy cập ứng dụng mua hàng.', userCount: 15420, color: 'bg-green-500' },
  { id: 'r4', name: 'Staff', description: 'Nhân viên kiểm duyệt nội dung và hỗ trợ.', userCount: 12, color: 'bg-orange-500' },
];

const MOCK_PERMISSIONS: PermissionGroup[] = [
  {
    id: 'ui_group',
    title: 'Giao diện hiển thị (Pages)',
    type: 'UI',
    items: [
      { id: 'ui_admin_dashboard', name: 'Admin Dashboard', description: 'Truy cập trang Tổng quan quản trị' },
      { id: 'ui_admin_users', name: 'User Management', description: 'Truy cập trang Quản lý người dùng' },
      { id: 'ui_admin_approvals', name: 'Partner Approvals', description: 'Truy cập trang Duyệt đối tác' },
      { id: 'ui_seller_dashboard', name: 'Seller Dashboard', description: 'Truy cập trang Tổng quan cửa hàng' },
      { id: 'ui_seller_products', name: 'Product Management', description: 'Truy cập trang Quản lý thực đơn' },
    ]
  },
  {
    id: 'api_group_users',
    title: 'API Người dùng (Users Endpoint)',
    type: 'API',
    items: [
      { id: 'api_users_read', name: 'GET /api/users', description: 'Lấy danh sách tất cả người dùng' },
      { id: 'api_users_write', name: 'POST, PUT /api/users', description: 'Tạo, sửa thông tin người dùng' },
      { id: 'api_users_delete', name: 'DELETE /api/users', description: 'Khóa hoặc xóa tài khoản' },
    ]
  },
  {
    id: 'api_group_products',
    title: 'API Món ăn (Products Endpoint)',
    type: 'API',
    items: [
      { id: 'api_products_read', name: 'GET /api/products', description: 'Lấy danh sách món ăn (Public)' },
      { id: 'api_products_write', name: 'POST, PUT /api/products', description: 'Đăng món ăn mới hoặc cập nhật' },
      { id: 'api_products_delete', name: 'DELETE /api/products', description: 'Xóa món ăn khỏi hệ thống' },
    ]
  }
];

export function AdminPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<Role>(MOCK_ROLES[0]);
  const [search, setSearch] = useState('');
  const [searchPermission, setSearchPermission] = useState('');
  
  // Trạng thái lưu trữ quyền đang được bật của từng Role (Mock)
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    'r1': ['ui_admin_dashboard', 'ui_admin_users', 'ui_admin_approvals', 'api_users_read', 'api_users_write', 'api_users_delete', 'api_products_read', 'api_products_write', 'api_products_delete'],
    'r2': ['ui_seller_dashboard', 'ui_seller_products', 'api_products_read', 'api_products_write', 'api_products_delete'],
    'r3': ['api_products_read'],
    'r4': ['ui_admin_dashboard', 'ui_admin_approvals', 'api_users_read', 'api_products_read'],
  });

  const handleTogglePermission = (permissionId: string) => {
    setRolePermissions(prev => {
      const currentRolePerms = prev[selectedRole.id] || [];
      const hasPerm = currentRolePerms.includes(permissionId);
      
      return {
        ...prev,
        [selectedRole.id]: hasPerm 
          ? currentRolePerms.filter(id => id !== permissionId)
          : [...currentRolePerms, permissionId]
      };
    });
  };

  const handleSave = () => {
    // Gọi API lưu xuống Backend ở đây
    console.log('Saved permissions for role:', selectedRole.name, rolePermissions[selectedRole.id]);
    alert('Đã lưu cấu hình phân quyền thành công!');
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân quyền Hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">Cấp quyền truy cập giao diện và API cho từng Vai trò (Roles).</p>
        </div>
        <Button onClick={handleSave} className="shadow-lg shadow-orange-500/20">
          <ShieldCheck className="w-5 h-5 mr-2" />
          Lưu cấu hình
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Roles List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-600" />
            Danh sách Vai trò
          </h2>
          
          <div className="relative mb-4">
            <Input 
              placeholder="Tìm kiếm vai trò..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {MOCK_ROLES.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(role => {
              const isSelected = selectedRole.id === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-orange-500 bg-orange-50/50 shadow-sm' 
                      : 'border-transparent hover:border-orange-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className={`font-bold ${isSelected ? 'text-orange-700' : 'text-gray-900'}`}>
                        {role.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                      {role.userCount} users
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
          <div className="mb-6 pb-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết quyền: <span className="text-orange-600">{selectedRole.name}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Bật tắt các công tắc để cấp quyền hoặc thu hồi quyền tương ứng.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Input 
                placeholder="Tìm quyền hoặc endpoint..." 
                value={searchPermission}
                onChange={(e) => setSearchPermission(e.target.value)}
                className="pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-8">
            {MOCK_PERMISSIONS.map(group => {
              // Lọc các item dựa vào search
              const filteredItems = group.items.filter(item => 
                item.name.toLowerCase().includes(searchPermission.toLowerCase()) || 
                item.description.toLowerCase().includes(searchPermission.toLowerCase())
              );
              
              if (filteredItems.length === 0) return null;

              return (
                <div key={group.id}>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    {group.type === 'UI' ? (
                      <Layout className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Database className="w-4 h-4 text-purple-500" />
                    )}
                    {group.title}
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {filteredItems.map(item => {
                      const isGranted = (rolePermissions[selectedRole.id] || []).includes(item.id);
                    
                    return (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors">
                        <div className="pr-4">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleTogglePermission(item.id)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                            isGranted ? 'bg-orange-500' : 'bg-gray-200'
                          }`}
                          role="switch"
                          aria-checked={isGranted}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isGranted ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          >
                            {isGranted && <Check className="w-3 h-3 text-orange-500" />}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
