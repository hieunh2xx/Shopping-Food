import { useState, useEffect } from 'react';
import { restaurantService } from '../services/RestaurantService';
import { orderService } from '../services/OrderService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ShoppingBag, 
  Star, 
  TrendingUp, 
  XOctagon, 
  Calendar, 
  ChevronRight, 
  Utensils
} from 'lucide-react';
import { Card } from '../components/common';

export function SellerDashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('30days');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Calculate start & end date based on timeRange
      let startDate: string | undefined;
      const endDate = new Date().toISOString();

      if (timeRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate = today.toISOString();
      } else if (timeRange === '7days') {
        const past7Days = new Date();
        past7Days.setDate(past7Days.getDate() - 7);
        startDate = past7Days.toISOString();
      } else if (timeRange === '30days') {
        const past30Days = new Date();
        past30Days.setDate(past30Days.getDate() - 30);
        startDate = past30Days.toISOString();
      }

      // 1. Get statistics
      const statsRes = await restaurantService.getDashboardStats({ startDate, endDate });
      if (!statsRes.error && statsRes.data) {
        setStats(statsRes.data);
      } else {
        toast.error(statsRes.message);
      }

      // 2. Get recent orders (take 5)
      const ordersRes = await orderService.getRestaurantOrders({ skip: 0, take: 5 });
      if (!ordersRes.error && ordersRes.data) {
        setRecentOrders(ordersRes.data);
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải dữ liệu tổng quan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">Chờ nhận đơn</span>;
      case 'Confirmed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">Đã nhận</span>;
      case 'Preparing':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-600">Đang nấu</span>;
      case 'WaitingForShipper':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-600">Chờ tài xế</span>;
      case 'Shipping':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-600">Đang giao</span>;
      case 'Delivered':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-600">Hoàn thành</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">Hủy đơn</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  if (isLoading && !stats) {
    return <div className="text-center py-10">Đang tải báo cáo tổng quan...</div>;
  }

  // Calculate sum of quantities for percentages
  const maxQty = stats?.bestSellers?.length > 0 
    ? Math.max(...stats.bestSellers.map((item: any) => item.quantity)) 
    : 1;

  return (
    <div className="p-6">
      {/* Header section with select date filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý cửa hàng</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hiệu quả kinh doanh của nhà hàng (UC-SYS-005)</p>
        </div>

        {/* Filter select */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer bg-transparent"
          >
            <option value="today">Hôm nay</option>
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
          </select>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Doanh thu */}
        <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Doanh số</p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Số đơn hàng */}
        <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Đơn đặt hàng</p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {stats?.totalOrders || 0} đơn
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Tỉ lệ hủy đơn */}
        <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Tỷ lệ hủy đơn</p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {stats?.cancellationRate || 0.0}%
              </h3>
              <p className="text-xs text-gray-400 mt-1">({stats?.cancelledOrders || 0} đơn bị hủy)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <XOctagon className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Đánh giá */}
        <Card className="p-6 bg-white border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Đánh giá sao</p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {(stats?.averageRating || 0.0).toFixed(1)} / 5.0
              </h3>
              <p className="text-xs text-gray-400 mt-1">({stats?.reviewCount || 0} lượt đánh giá)</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
              <Star className="w-6 h-6 fill-current" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid: Best sellers & Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 cols: Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Đơn hàng mới nhận</h3>
            <Link 
              to="/seller/orders" 
              className="text-orange-500 text-sm font-semibold hover:text-orange-600 flex items-center gap-1 transition-colors"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <Card className="bg-white border border-gray-100 overflow-hidden shadow-sm">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center h-48">
                <ShoppingBag className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm">Hiện chưa có đơn đặt hàng mới.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Mã đơn</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Tổng tiền</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">
                          <Link to="/seller/orders" className="hover:text-orange-500">
                            #{order.id.substring(0, 8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{order.contactName}</p>
                            <p className="text-xs text-gray-400">{order.contactPhone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {order.totalAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 col: Best Selling Items */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Món ăn bán chạy</h3>
          
          <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-6">
            {!stats?.bestSellers || stats.bestSellers.length === 0 ? (
              <div className="text-center py-8 text-gray-400 flex flex-col items-center justify-center">
                <Utensils className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">Chưa có dữ liệu món bán chạy.</p>
              </div>
            ) : (
              stats.bestSellers.map((item: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-800 line-clamp-1 flex-1">
                      {idx + 1}. {item.itemName}
                    </span>
                    <span className="font-bold text-gray-900 ml-2">
                      {item.quantity} bán ra
                    </span>
                  </div>

                  {/* Custom progress bar */}
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Doanh thu:</span>
                    <span className="font-medium">{item.revenue.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
