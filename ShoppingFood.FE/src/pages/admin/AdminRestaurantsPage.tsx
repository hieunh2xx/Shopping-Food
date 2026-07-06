import { useState, useEffect } from 'react';
import { useAdmin } from '../../hooks';
import { Store, ShieldAlert, ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Input } from '../../components/common';
import toast from 'react-hot-toast';
import { httpClient } from '../../services/base/HttpClient';
import { API_ENDPOINTS } from '../../config/endpoints';

export function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const take = 10;

  useEffect(() => {
    fetchRestaurants();
  }, [page, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchRestaurants();
      else setPage(1); // Will trigger the first useEffect
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      let url = `${API_ENDPOINTS.ADMIN.RESTAURANTS}?skip=${skip}&take=${take}`;
      if (searchTerm) url += `&filter=${encodeURIComponent(searchTerm)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      const res = await httpClient.get<any>(url);
      if (!res.error && res.data) {
        setRestaurants(res.data);
        setTotal(res.total || 0);
      }
    } catch {
      toast.error('Lỗi tải danh sách nhà hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSuspend = async (restaurantId: string, currentStatus: string) => {
    const isSuspended = currentStatus === 'Suspended';
    const action = isSuspended ? 'MỞ KHÓA' : 'KHÓA';
    if (!confirm(`Bạn có chắc muốn ${action} nhà hàng này không?`)) return;

    setIsUpdating(true);
    try {
      const res = await httpClient.put<any>(API_ENDPOINTS.ADMIN.SUSPEND_RESTAURANT, {
        restaurantId,
        isSuspended: !isSuspended
      });

      if (!res.error) {
        toast.success(`Đã ${action.toLowerCase()} nhà hàng`);
        fetchRestaurants();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleVerification = async (restaurantId: string) => {
    if (!confirm('Bạn có chắc muốn cấp/hủy nhãn Quán Ăn Chuẩn cho nhà hàng này không?')) return;
    setIsUpdating(true);
    try {
      const res = await httpClient.post<any>(API_ENDPOINTS.ADMIN.TOGGLE_VERIFICATION(restaurantId), {});
      if (!res.error) {
        toast.success('Đã cập nhật nhãn tín nhiệm');
        fetchRestaurants();
      } else {
        toast.error(res.message || 'Lỗi khi cập nhật nhãn');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý danh sách nhà hàng và đối tác trên hệ thống</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tên, email, SĐT..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Suspended">Bị khóa</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Nhà hàng</th>
                <th className="py-4 px-6 font-medium">Email / SĐT</th>
                <th className="py-4 px-6 font-medium">Địa chỉ</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium text-center">Tín nhiệm</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((rest) => (
                <tr key={rest.id} className="hover:bg-orange-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                        {rest.logoUrl ? (
                          <img src={rest.logoUrl} className="w-full h-full rounded-lg object-cover" alt="logo" />
                        ) : (
                          <Store className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 line-clamp-1">{rest.restaurantName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-600">{rest.email}</div>
                    <div className="text-xs text-gray-500">{rest.phone}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    <span className="line-clamp-2">{rest.address}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${rest.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' :
                        rest.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                      {rest.status === 'Active' ? 'Hoạt động' : rest.status === 'Suspended' ? 'Bị khóa' : rest.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {rest.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant={rest.isVerified ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleVerification(rest.id)}
                        disabled={isUpdating}
                        className={rest.isVerified ? 'text-gray-600' : ''}
                      >
                        {rest.isVerified ? 'Hủy nhãn' : 'Cấp nhãn'}
                      </Button>
                      <Button
                        variant={rest.status === 'Suspended' ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleSuspend(rest.id, rest.status)}
                        disabled={isUpdating}
                        className={rest.status === 'Suspended' ? 'text-green-600 border-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}
                      >
                        {rest.status === 'Suspended' ? (
                          <>
                            <ShieldCheck className="w-4 h-4 mr-1" />
                            Mở khóa
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 mr-1" />
                            Khóa
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Không tìm thấy nhà hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị <span className="font-medium text-gray-900">{(page - 1) * take + 1}</span> đến{' '}
              <span className="font-medium text-gray-900">{Math.min(page * take, total)}</span> trong tổng số{' '}
              <span className="font-medium text-gray-900">{total}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * take >= total}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
