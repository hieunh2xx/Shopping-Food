import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingCart, TrendingUp, TrendingDown, Map as MapIcon, UserPlus, Truck, Store, Download, Wallet, ChevronRight } from 'lucide-react';
import { Card } from '../components/common';
import { adminService } from '../services/AdminService';
import { OrderHeatmap } from '../components/admin/OrderHeatmap';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { IAdminDashboardStats, IHeatmapPoint } from '../interfaces';
import { ROUTES } from '../routes/routeConfig';

/**
 * Thẻ Thống Kê Có Thể Nhấp Để Điều Hướng (StatLink).
 */
function StatLink({
  to,
  className = '',
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`block group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl ${className}`}
    >
      <Card
        hoverable
        className="h-full border border-gray-100 shadow-sm group-hover:border-purple-200 group-hover:shadow-md transition-all relative"
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-purple-500" />
        </div>
        {children}
      </Card>
    </Link>
  );
}

/**
 * Bảng Thống Kê Tổng Quan Quản Trị Viên (AdminDashboardPage).
 * Cung cấp bức tranh tài chính và vận hành toàn diện cho Admin:
 * - Tổng giá trị giao dịch hàng hóa (GMV), Doanh thu sàn, Chi trả cho Nhà hàng và Tài xế
 * - Tỷ lệ tăng trưởng người dùng mới, tài xế mới và quán ăn mới
 * - Biểu đồ phân bổ doanh thu theo ngày (Recharts LineChart)
 * - Bản đồ nhiệt mật độ đơn hàng (OrderHeatmap)
 * - Xuất báo cáo tài chính ra file Excel hoặc PDF.
 */
export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(7);
  const [stats, setStats] = useState<IAdminDashboardStats | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<IHeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchHeatmap();
  }, [days]);

  /**
   * Tải số liệu thống kê tổng hợp từ máy chủ cho khoảng thời gian lựa chọn.
   */
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getDashboardStats(days);
      if (!res.error) {
        setStats(res.data);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tải danh sách tọa độ đơn hàng để dựng bản đồ nhiệt (Heatmap).
   */
  const fetchHeatmap = async () => {
    try {
      const res = await adminService.getOrderHeatmap(days);
      if (!res.error) {
        setHeatmapPoints(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải Heatmap', err);
    }
  };

  /**
   * Xuất báo cáo tài chính dưới dạng file Excel hoặc PDF.
   * @param format - Định dạng file ('excel' hoặc 'pdf')
   */
  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const toastId = toast.loading(`Đang xuất báo cáo ${format.toUpperCase()}...`);
      const blob = await adminService.exportFinancialReport(days, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BaoCaoTaiChinh_${days}ngay.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Xuất ${format.toUpperCase()} thành công!`, { id: toastId });
    } catch {
      toast.error(`Lỗi khi xuất ${format.toUpperCase()}`);
    }
  };

  /**
   * Định dạng số tiền sang chuẩn tiền tệ Việt Nam VNĐ.
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  /**
   * Render huy hiệu tăng trưởng kèm mũi tên xanh (tăng) / đỏ (giảm).
   */
  const renderGrowthBadge = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {isPositive ? '+' : ''}{rate}%
      </div>
    );
  };

  /**
   * Định dạng tooltip hiển thị trên biểu đồ đường doanh thu.
   */
  const chartTooltipFormatter = (value: unknown, name: unknown) => {
    const key = String(name);
    const labels: Record<string, string> = {
      gmv: 'GMV (tổng đơn)',
      platformRevenue: 'Doanh thu sàn',
      sellerPayout: 'Trả seller',
      shipperIncome: 'Trả shipper',
      ordersCount: 'Số đơn',
    };
    const num = Number(value ?? 0);
    if (key === 'ordersCount') return [num, labels[key]];
    return [formatCurrency(num), labels[key] || key];
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Thống kê</h1>
          <p className="text-gray-500">
            Phân bổ thanh toán nền tảng · {days} ngày gần nhất
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Xuất PDF
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDays(7)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${days === 7 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              7 Ngày
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${days === 30 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              30 Ngày
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : stats ? (
        <>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Phân bổ dòng tiền trong kỳ</h2>
            <p className="text-sm text-gray-500 mb-4">
              GMV = Doanh thu sàn + Trả seller + Phí ship (và các khoản liên quan). Dùng để biết cần thanh toán bao nhiêu cho từng bên.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatLink to={ROUTES.ADMIN_FINANCE}>
                <div className="p-5">
                  <p className="text-sm font-medium text-gray-500 mb-1">GMV toàn nền tảng</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.grossMerchandiseValue)}</p>
                  <p className="text-xs text-gray-400 mt-1">Tổng tiền khách thanh toán · {stats.totalOrders} đơn</p>
                  <p className="text-[11px] text-purple-600 mt-2 font-medium group-hover:underline">Xem tài chính / COD →</p>
                </div>
              </StatLink>
              <StatLink to={ROUTES.ADMIN_FINANCE}>
                <div className="p-5 border-0 bg-orange-50/40 rounded-2xl">
                  <p className="text-sm font-medium text-orange-700 mb-1">Doanh thu sàn (platform)</p>
                  <p className="text-2xl font-bold text-orange-800">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-orange-600/80 mt-1">Chiết khấu · VAT ~ {formatCurrency(stats.estimatedTax)}</p>
                  <p className="text-[11px] text-orange-700 mt-2 font-medium group-hover:underline">Chi tiết dòng tiền →</p>
                </div>
              </StatLink>
              <StatLink to="/admin/seller-revenues">
                <div className="p-5 bg-green-50/40 rounded-2xl">
                  <p className="text-sm font-medium text-green-700 mb-1">Cần trả seller</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalSellerPayout)}</p>
                  <p className="text-xs text-green-600/80 mt-1">Tiền món sau trừ hoa hồng sàn</p>
                  <p className="text-[11px] text-green-700 mt-2 font-medium group-hover:underline">Doanh thu theo quán →</p>
                </div>
              </StatLink>
              <StatLink to="/admin/shipper-revenues">
                <div className="p-5 bg-blue-50/40 rounded-2xl">
                  <p className="text-sm font-medium text-blue-700 mb-1">Cần trả shipper</p>
                  <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalShipperIncome)}</p>
                  <p className="text-xs text-blue-600/80 mt-1">Thu nhập giao hàng trong kỳ</p>
                  <p className="text-[11px] text-blue-700 mt-2 font-medium group-hover:underline">Doanh thu theo shipper →</p>
                </div>
              </StatLink>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatLink to={ROUTES.ADMIN_FINANCE}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Sàn sau VAT ước tính</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.netPlatformRevenue)}</p>
                  </div>
                </div>
              </div>
            </StatLink>
            <StatLink to={ROUTES.ADMIN_DISPATCH_HISTORY}>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Số đơn trong kỳ</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </StatLink>
            <StatLink to="/admin/users">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Người dùng Online</p>
                    <p className="text-xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
            </StatLink>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-2 mb-4">Người dùng mới & Tăng trưởng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatLink to="/admin/users">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Khách hàng mới</p>
                      <p className="text-xl font-bold text-gray-900">{stats.newCustomers}</p>
                    </div>
                  </div>
                  {renderGrowthBadge(stats.customerGrowthRate)}
                </div>
              </div>
            </StatLink>

            <StatLink to={ROUTES.ADMIN_SHIPPERS}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tài xế mới</p>
                      <p className="text-xl font-bold text-gray-900">{stats.newShippers}</p>
                    </div>
                  </div>
                  {renderGrowthBadge(stats.shipperGrowthRate)}
                </div>
              </div>
            </StatLink>

            <StatLink to="/admin/restaurants">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                      <Store className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nhà hàng mới</p>
                      <p className="text-xl font-bold text-gray-900">{stats.newRestaurants}</p>
                    </div>
                  </div>
                  {renderGrowthBadge(stats.restaurantGrowthRate)}
                </div>
              </div>
            </StatLink>
          </div>

          <div className="grid grid-cols-1 gap-6 mt-4">
            <StatLink to={ROUTES.ADMIN_FINANCE}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gray-500" />
                      Biểu đồ phân bổ theo ngày ({days} ngày)
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Theo dõi GMV, doanh thu sàn, trả seller và trả shipper theo từng ngày trong kỳ
                    </p>
                  </div>
                  <span className="text-sm text-purple-600 font-medium hidden sm:inline group-hover:underline">Mở trang Tài chính →</span>
                </div>
                <div className="h-96 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={stats.revenueChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" padding={{ left: 20, right: 20 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tickFormatter={(val) => `${val / 1000}k`} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={chartTooltipFormatter}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="gmv" name="GMV (tổng đơn)" stroke="#64748b" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="platformRevenue" name="Doanh thu sàn" stroke="#ea580c" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line yAxisId="left" type="monotone" dataKey="sellerPayout" name="Trả seller" stroke="#16a34a" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="shipperIncome" name="Trả shipper" stroke="#2563eb" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="ordersCount" name="Số đơn" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </StatLink>

            <StatLink to={ROUTES.ADMIN_DISPATCH_HISTORY}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-gray-500" />
                    Bản đồ nhiệt mật độ đơn hàng
                  </h3>
                  <span className="text-sm text-purple-600 font-medium hidden sm:inline group-hover:underline">Lịch sử điều phối →</span>
                </div>
                <div className="h-80 w-full bg-gray-50 rounded-xl overflow-hidden relative pointer-events-none">
                  {heatmapPoints.length > 0 ? (
                    <OrderHeatmap points={heatmapPoints} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      Chưa có đủ dữ liệu tọa độ để vẽ bản đồ nhiệt
                    </div>
                  )}
                </div>
              </div>
            </StatLink>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Không có dữ liệu
        </div>
      )}
    </div>
  );
}
