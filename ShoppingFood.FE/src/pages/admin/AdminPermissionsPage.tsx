import { useState, useEffect, useMemo } from 'react';
import { Database, Check, ShieldCheck, Search, Users, Loader2 } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { adminService } from '../../services/AdminService';
import toast from 'react-hot-toast';

// 0: Admin, 1: Seller, 2: Mall, 3: Customer, 4: Shipper, 5: Coordinator
const ROLES = [
  { id: 0, name: 'Admin', description: 'Quản trị viên cấp cao, toàn quyền truy cập hệ thống (Đã Bypass Filter).', color: 'bg-purple-500' },
  { id: 5, name: 'Coordinator', description: 'Nhân viên điều phối và hỗ trợ.', color: 'bg-orange-500' },
  { id: 1, name: 'Seller', description: 'Đối tác nhà hàng tiêu chuẩn.', color: 'bg-blue-500' },
  { id: 2, name: 'Mall', description: 'Đối tác nhà hàng Mall.', color: 'bg-indigo-500' },
  { id: 4, name: 'Shipper', description: 'Tài xế giao hàng.', color: 'bg-yellow-500' },
  { id: 3, name: 'Customer', description: 'Khách hàng mua hàng.', color: 'bg-green-500' },
];

export function AdminPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [search, setSearch] = useState('');
  const [searchPermission, setSearchPermission] = useState('');
  
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    fetchRolePermissions(selectedRole.id);
  }, [selectedRole.id]);

  const fetchEndpoints = async () => {
    setIsLoadingEndpoints(true);
    try {
      const res = await adminService.getApiEndpoints();
      if (!res.error && res.data) {
        setEndpoints(res.data);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách API Endpoints');
    } finally {
      setIsLoadingEndpoints(false);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    setIsLoadingRole(true);
    try {
      const res = await adminService.getRolePermissions(roleId);
      if (!res.error && res.data) {
        setRolePermissions(res.data);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách quyền của Role');
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleTogglePermission = (endpointId: string) => {
    setRolePermissions(prev => {
      if (prev.includes(endpointId)) {
        return prev.filter(id => id !== endpointId);
      } else {
        return [...prev, endpointId];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await adminService.updateRolePermissions(selectedRole.id, rolePermissions);
      if (!res.error) {
        toast.success(`Đã lưu cấu hình phân quyền cho ${selectedRole.name}`);
      } else {
        toast.error(res.message || 'Lỗi lưu cấu hình');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, any[]> = {};
    endpoints.forEach(ep => {
      const key = ep.controllerName || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(ep);
    });
    return groups;
  }, [endpoints]);

  return (
    <div className="p-6 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân quyền Hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">Cấp quyền truy cập API Endpoints cho từng Vai trò (Roles).</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoadingEndpoints || isLoadingRole} className="shadow-lg shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 text-white">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
          Lưu cấu hình
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Column: Roles List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col min-h-0">
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
            {ROLES.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(role => {
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
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col min-h-0">
          <div className="mb-6 pb-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết quyền: <span className="text-orange-600">{selectedRole.name}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-1">Bật tắt các công tắc để cấp quyền hoặc thu hồi quyền truy cập API.</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Input 
                placeholder="Tìm endpoint..." 
                value={searchPermission}
                onChange={(e) => setSearchPermission(e.target.value)}
                className="pl-10"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-8">
            {isLoadingEndpoints || isLoadingRole ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
                Đang tải dữ liệu phân quyền...
              </div>
            ) : Object.keys(groupedEndpoints).map(groupName => {
              const items = groupedEndpoints[groupName].filter(item => 
                item.path.toLowerCase().includes(searchPermission.toLowerCase()) || 
                item.name?.toLowerCase().includes(searchPermission.toLowerCase()) ||
                item.module?.toLowerCase().includes(searchPermission.toLowerCase())
              );
              
              if (items.length === 0) return null;

              return (
                <div key={groupName}>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Database className="w-4 h-4 text-purple-500" />
                    {groupName} Controller
                  </h3>
                  
                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
                    {items.map(item => {
                      const isGranted = rolePermissions.includes(item.id);
                    
                      return (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-100/50 transition-colors">
                          <div className="pr-4">
                            <p className="font-medium text-gray-900">{item.method} {item.path}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{item.name || item.module || 'Không có mô tả'}</p>
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
            
            {!isLoadingEndpoints && endpoints.length === 0 && (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Chưa có dữ liệu API Endpoints trong hệ thống.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
