import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';
import { Button, Input } from '../../components/common';

export function SellerProductsPage() {
  const [search, setSearch] = useState('');

  // Mock data for UI presentation
  const mockProducts = [
    { id: '1', name: 'Phở bò tái nạm', price: 55000, category: 'Món nước', status: 'InStock', sales: 120 },
    { id: '2', name: 'Cơm tấm sườn bì chả', price: 65000, category: 'Cơm', status: 'InStock', sales: 340 },
    { id: '3', name: 'Trà đào cam sả', price: 35000, category: 'Đồ uống', status: 'OutOfStock', sales: 85 },
    { id: '4', name: 'Bánh mì xíu mại trứng muối', price: 30000, category: 'Bánh mì', status: 'InStock', sales: 210 },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-sm text-gray-500 mt-1">Thêm, sửa, xóa các món ăn của cửa hàng</p>
        </div>
        <Button className="shrink-0 shadow-lg shadow-orange-500/20">
          <Plus className="w-5 h-5 mr-2" />
          Thêm món mới
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tên món ăn..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500">
            <option value="all">Tất cả danh mục</option>
            <option value="drink">Đồ uống</option>
            <option value="food">Đồ ăn</option>
          </select>
          <Button variant="secondary" className="px-3">
            <Filter className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Tên món</th>
                <th className="py-4 px-6 font-medium">Danh mục</th>
                <th className="py-4 px-6 font-medium">Giá bán</th>
                <th className="py-4 px-6 font-medium text-center">Đã bán</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-orange-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                        🍜
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{product.category}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-gray-900">
                    {product.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 text-center">{product.sales}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      product.status === 'InStock' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {product.status === 'InStock' ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Hiển thị 1 đến 4 trong số 4 món</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 bg-gray-50 text-orange-600 font-medium">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
