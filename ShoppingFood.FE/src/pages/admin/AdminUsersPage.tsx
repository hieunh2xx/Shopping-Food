import { useState } from 'react';
import { Search, Shield, Ban, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/common';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');

  // Mock data for UI presentation
  const mockUsers = [
    { id: '1', name: 'Nguyễn Văn A', email: 'vana@gmail.com', role: 'Customer', status: 'Active', date: '20/10/2023' },
    { id: '2', name: 'Trần Thị B', email: 'thib@gmail.com', role: 'Seller', status: 'Active', date: '15/09/2023' },
    { id: '3', name: 'Lê Văn C', email: 'vanc@gmail.com', role: 'Customer', status: 'Banned', date: '01/11/2023' },
    { id: '4', name: 'Quản Trị Viên', email: 'admin@shoppingfood.com', role: 'Admin', status: 'Active', date: '01/01/2023' },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý danh sách khách hàng và đối tác trên hệ thống</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm email, tên người dùng..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500">
            <option value="all">Tất cả vai trò</option>
            <option value="Customer">Khách hàng</option>
            <option value="Seller">Đối tác</option>
            <option value="Admin">Admin</option>
          </select>
          <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500">
            <option value="all">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Banned">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Người dùng</th>
                <th className="py-4 px-6 font-medium">Email</th>
                <th className="py-4 px-6 font-medium">Vai trò</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium">Ngày tham gia</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-orange-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{user.email}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'Seller' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'Admin' && <Shield className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'Active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{user.date}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'Active' ? (
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Khóa tài khoản"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mở khóa tài khoản"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
