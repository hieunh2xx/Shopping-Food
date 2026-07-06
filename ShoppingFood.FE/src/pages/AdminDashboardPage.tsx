import React, { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Map as MapIcon, UserPlus, Truck, Store, Download } from 'lucide-react';
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

export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(7);
  const [stats, setStats] = useState<IAdminDashboardStats | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<IHeatmapPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchHeatmap();
  }, [days]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getDashboardStats(days);
      if (!res.error) {
        setStats(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải thống kê');
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (error) {
      toast.error(`Lỗi khi xuất ${format.toUpperCase()}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const renderGrowthBadge = (rate: number) => {
    const isPositive = rate >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {isPositive ? '+' : ''}{rate}%
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Thống kê</h1>
          <p className="text-gray-500">Tổng quan hoạt động doanh thu và đơn hàng</p>
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
          {/* Row 1: Main Stats (UC-SYS-001) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Tổng doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Số đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Người dùng Online</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Row 2: Growth Stats (UC-SYS-002) */}
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Người dùng mới & Tăng trưởng</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
            </Card>

            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
            </Card>

            <Card className="p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
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
            </Card>
          </div>

          {/* Row 3: Charts and Heatmap (UC-SYS-001 & UC-SYS-003) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gray-500" /> 
                  Biểu đồ Doanh thu & Đơn hàng
                </h3>
              </div>
              <div className="h-80">
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
                      formatter={(value: number, name: string) => [name === 'revenue' ? formatCurrency(value) : value, name === 'revenue' ? 'Doanh thu' : 'Số đơn']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#16a34a" strokeWidth={3} activeDot={{ r: 8 }} />
                    <Line yAxisId="right" type="monotone" dataKey="ordersCount" name="Số đơn" stroke="#3b82f6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-gray-500" />
                  Bản đồ nhiệt mật độ đơn hàng
                </h3>
              </div>
              <div className="h-80 w-full bg-gray-50 rounded-xl overflow-hidden relative">
                {heatmapPoints.length > 0 ? (
                  <OrderHeatmap points={heatmapPoints} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Chưa có đủ dữ liệu tọa độ để vẽ bản đồ nhiệt
                  </div>
                )}
              </div>
            </Card>
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
