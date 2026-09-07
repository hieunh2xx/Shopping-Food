import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PackageOpen,
  CheckCircle2,
  Calendar,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { shipperService } from '../../services';
import { Pagination } from '../../components/common';
import { ShipperOrderDetailModal } from '../../components/order/ShipperOrderDetailModal';
import type { IDailyIncomeReportDto, IShipperCompletedOrderDto } from '../../interfaces/IShipper';
import { formatCurrency } from '../../utils/formatters';

/**
 * Tạo danh sách các tùy chọn tháng để lọc lịch sử giao hàng.
 */
function buildMonthOptions(monthsBack = 12) {
  const now = new Date();
  const options: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const label =
      i === 0
        ? `Tháng này (${start.getMonth() + 1}/${start.getFullYear()})`
        : i === 1
          ? `Tháng trước (${start.getMonth() + 1}/${start.getFullYear()})`
          : `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`;
    options.push({ key, label, start, end });
  }
  return options;
}

/**
 * Trang Lịch Sử Chuyến Giao Hàng & Thu Nhập Của Tài Xế (ShipperHistoryPage).
 * Tổng hợp các chuyến giao hàng thành công:
 * - Biểu đồ cột Recharts thống kê thu nhập theo ngày trong tháng
 * - Danh sách đơn hàng đã hoàn tất kèm chi tiết cước phí cơ bản, cước khoảng cách và thưởng cao điểm
 * - Mở modal xem lại lộ trình và thông tin đơn hàng đã giao (`ShipperOrderDetailModal`).
 */
export function ShipperHistoryPage() {
  const monthOptions = useMemo(() => buildMonthOptions(12), []);
  const [monthKey, setMonthKey] = useState(monthOptions[0].key);
  const [loading, setLoading] = useState(true);
  const [dailyReports, setDailyReports] = useState<IDailyIncomeReportDto[]>([]);
  const [orders, setOrders] = useState<IShipperCompletedOrderDto[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);


  const selectedMonth = monthOptions.find((m) => m.key === monthKey) || monthOptions[0];

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const res = await shipperService.getIncomeReport(
        selectedMonth.start.toISOString(),
        selectedMonth.end.toISOString(),
        skip,
        pageSize
      );
      if (res.data) {
        setDailyReports(res.data.dailyReports || []);
        setOrders(res.data.orders || []);
        setTotalIncome(res.data.totalIncome);
        setTotalOrders(res.data.completedOrdersCount);
        setOrdersTotalCount(res.data.ordersTotalCount ?? res.data.orders?.length ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, page, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setPage(1);
  }, [monthKey]);

  const chartData = dailyReports.map((d) => ({
    label: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    income: d.totalIncome,
    orders: d.completedOrdersCount,
  }));

  const totalPages = Math.max(1, Math.ceil(ordersTotalCount / pageSize));

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">Danh sách đơn đã giao — bấm vào để xem chi tiết</p>
        </div>
        <select
          value={monthKey}
          onChange={(e) => setMonthKey(e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer min-w-[220px]"
        >
          {monthOptions.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng thu nhập</span>
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-extrabold">{formatCurrency(totalIncome)}</h3>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Đơn hoàn thành</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-extrabold">{totalOrders} đơn</h3>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ngày có giao</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-extrabold">{dailyReports.length} ngày</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Biểu đồ thu nhập theo ngày
        </h2>
        <p className="text-xs text-gray-500 mb-4">{selectedMonth.label}</p>
        {loading ? (
          <div className="h-56 flex items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Đang tải biểu đồ...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu tháng này</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  labelFormatter={(l) => `Ngày ${l}`}
                />
                <Bar dataKey="income" name="Thu nhập" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Danh sách đơn</h2>
          <span className="text-xs text-gray-500">{ordersTotalCount} đơn</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Đang tải danh sách...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 flex flex-col items-center">
            <PackageOpen className="w-14 h-14 text-gray-300 mb-2" />
            <h3 className="font-bold text-gray-700">Không có đơn trong tháng này</h3>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {orders.map((order) => (
              <button
                key={order.orderId}
                type="button"
                onClick={() => setSelectedOrderId(order.orderId)}
                className="w-full text-left px-4 py-3.5 hover:bg-orange-50/60 transition-colors flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900">#{order.orderId.slice(0, 8).toUpperCase()}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.status === 'Delivered' ? 'Hoàn thành' : 'Đã hủy'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{order.contactName} · {order.deliveryAddress}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(order.completedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(order.totalIncome)}</p>
                  <p className="text-[11px] text-gray-400">{formatCurrency(order.totalAmount)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50]}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>

      <ShipperOrderDetailModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
