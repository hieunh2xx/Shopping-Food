import { useState, useEffect } from 'react';
import { Search, Loader2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Input, Pagination } from '../../components/common';
import { adminService } from '../../services/AdminService';
import type { IActionLogDto, IErrorLogDto } from '../../interfaces';
import toast from 'react-hot-toast';

/**
 * Trang Nhật Ký Hoạt Động & Lỗi Hệ Thống (AdminSystemLogsPage).
 * Giám sát và tra cứu dấu vết vận hành nền tảng:
 * - Tab "Nhật ký hành động": Ghi lại mọi thao tác tạo, sửa, xóa, duyệt của các người dùng trên hệ thống
 * - Tab "Nhật ký lỗi hệ thống": Ghi nhận các Exception, StackTrace và mã lỗi từ Backend
 * - Tìm kiếm theo từ khóa và sắp xếp theo thứ tự thời gian.
 */
export function AdminSystemLogsPage() {
  const [activeTab, setActiveTab] = useState<'action' | 'error'>('action');
  const [search, setSearch] = useState('');
  const [orderDirection, setOrderDirection] = useState<'desc' | 'asc'>('desc');
  
  const [actionLogs, setActionLogs] = useState<IActionLogDto[]>([]);
  const [errorLogs, setErrorLogs] = useState<IErrorLogDto[]>([]);

  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, activeTab, orderDirection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchLogs();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      if (activeTab === 'action') {
        const res = await adminService.getActionLogs(skip, take, search, orderDirection);
        if (!res.error && res.data) {
          setActionLogs(res.data);
          setTotal(res.total || 0);
        }
      } else {
        const res = await adminService.getErrorLogs(skip, take, search, orderDirection);
        if (!res.error && res.data) {
          setErrorLogs(res.data);
          setTotal(res.total || 0);
        }
      }
    } catch {
      toast.error('Có lỗi khi tải nhật ký hệ thống.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(total / take);

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và giám sát các hoạt động, lỗi hệ thống</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('action'); setPage(1); setSearch(''); }}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'action'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Nhật ký hoạt động
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('error'); setPage(1); setSearch(''); }}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'error'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Nhật ký lỗi
          </div>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-96 relative">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'action' ? "Tìm kiếm user, action..." : "Tìm kiếm action, message..."}
              className="pl-10"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <select
            value={orderDirection}
            onChange={(e) => { setOrderDirection(e.target.value as 'desc' | 'asc'); setPage(1); }}
            className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
          >
            <option value="desc">Mới nhất trước</option>
            <option value="asc">Cũ nhất trước</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 whitespace-nowrap">
          Tổng: <span className="font-semibold text-gray-900 ml-1.5">{total}</span>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'action' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600 font-medium">
                  <th className="py-4 px-6 w-48">Thời gian</th>
                  <th className="py-4 px-6 w-48">Người dùng</th>
                  <th className="py-4 px-6 w-48">Hành động</th>
                  <th className="py-4 px-6">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                    </td>
                  </tr>
                ) : actionLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">Không có dữ liệu</td>
                  </tr>
                ) : (
                  actionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900 text-sm">{log.userName}</span>
                      </td>
                      <td className="py-4 px-6">
                        {(() => {
                          const action = log.action;
                          if (action && action.includes('||')) {
                            const parts = action.split('||');
                            if (parts.length >= 3) {
                              const ip = parts[0];
                              const method = parts[1];
                              const path = parts.slice(2).join('||');
                              
                              const methodColor = 
                                method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                method === 'POST' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                method === 'PUT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                method === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200';

                              return (
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${methodColor}`}>
                                      {method}
                                    </span>
                                    <span className="text-[11px] font-mono text-gray-700 truncate max-w-[180px]" title={path}>
                                      {path}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                    IP: {ip === '::1' ? 'localhost' : ip}
                                  </span>
                                </div>
                              );
                            }
                          }
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {action}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 break-words max-w-md">
                        {log.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-red-50/50 border-b border-red-100 text-sm text-red-800 font-medium">
                  <th className="py-4 px-6 w-48">Thời gian</th>
                  <th className="py-4 px-6 w-48">Hành động lỗi</th>
                  <th className="py-4 px-6">Nội dung Exception</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-red-500 mx-auto" />
                    </td>
                  </tr>
                ) : errorLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-gray-500">Không có dữ liệu lỗi</td>
                  </tr>
                ) : (
                  errorLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700 break-words max-w-xl">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs font-mono text-red-600/90 whitespace-pre-wrap">
                          {log.exceptionMessage}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center bg-gray-50/50">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
