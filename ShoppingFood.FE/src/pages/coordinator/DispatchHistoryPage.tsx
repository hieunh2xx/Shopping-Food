import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { coordinatorService } from '../../services';
import toast from 'react-hot-toast';

export default function DispatchHistoryPage() {
  const [histories, setHistories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const take = 10;

  useEffect(() => {
    fetchHistories();
  }, [page, actionFilter]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchHistories();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchHistories = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const params: any = {
        skip,
        take,
      };
      if (searchTerm) params.filter = searchTerm;
      if (actionFilter !== 'all') params.actionType = actionFilter;

      const res = await coordinatorService.getAllDispatchHistories(params);
      if (!res.error && res.data) {
        setHistories(res.data);
        setTotal(res.total || 0);
      }
    } catch {
      toast.error('Tải lịch sử điều phối thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'ManualAssigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Expired':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Canceled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getActionName = (action: string) => {
    switch (action) {
      case 'ManualAssigned':
        return 'Đã gán đơn';
      case 'Accepted':
        return 'Đồng ý nhận';
      case 'Rejected':
        return 'Từ chối đơn';
      case 'Expired':
        return 'Hết hạn đề xuất';
      case 'Canceled':
        return 'Đã thu hồi đơn';
      default:
        return action;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6 text-orange-500" />
          Lịch sử Điều phối
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi toàn bộ lịch sử thao tác của các coordinator và phản hồi của shipper đối với các đơn hàng
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm mã đơn, người thực hiện..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">Tất cả hành động</option>
            <option value="ManualAssigned">Đã gán đơn</option>
            <option value="Accepted">Đồng ý nhận</option>
            <option value="Rejected">Từ chối đơn</option>
            <option value="Expired">Hết hạn đề xuất</option>
            <option value="Canceled">Đã thu hồi đơn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                  <th className="py-4 px-6 font-medium">Mã đơn hàng</th>
                  <th className="py-4 px-6 font-medium">Người thực hiện</th>
                  <th className="py-4 px-6 font-medium">Vai trò</th>
                  <th className="py-4 px-6 font-medium text-center">Hành động</th>
                  <th className="py-4 px-6 font-medium">Đối tượng liên quan (Shipper)</th>
                  <th className="py-4 px-6 font-medium">Ghi chú</th>
                  <th className="py-4 px-6 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {histories.map((log) => (
                  <tr key={log.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                      <span className="font-mono text-xs">{log.orderId}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-800">{log.actorName}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        log.actorRole === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        log.actorRole === 'Coordinator' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${getActionBadgeColor(log.actionType)}`}>
                        {getActionName(log.actionType)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {log.targetShipperName || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {log.note || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}

                {histories.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Không tìm thấy lịch sử điều phối nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
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
