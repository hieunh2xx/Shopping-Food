import { useState, useEffect, useCallback } from 'react';
import { 
  PackageOpen, 
  CheckCircle2, 
  Calendar,
  Search,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { shipperService } from '../../services';
import type { IDailyIncomeReportDto } from '../../interfaces/IShipper';

export function ShipperHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [dailyReports, setDailyReports] = useState<IDailyIncomeReportDto[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;

    if (filterPeriod === 'week') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    } else if (filterPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Last 90 days
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    }

    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  }, [filterPeriod]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await shipperService.getIncomeReport(startDate, endDate);
      if (res.data) {
        setDailyReports(res.data.dailyReports || []);
        setTotalIncome(res.data.totalIncome);
        setTotalOrders(res.data.completedOrdersCount);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatCurrency = (amount: number | undefined | null) => {
    const validAmount = (typeof amount === 'number' && !isNaN(amount)) ? amount : 0;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(validAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // Filter daily reports by search (date)
  const filteredReports = dailyReports.filter(day => {
    if (!searchTerm) return true;
    const dateStr = formatDate(day.date).toLowerCase();
    return dateStr.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Đang tải lịch sử giao hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử giao hàng</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tổng kết các đơn hàng bạn đã giao nhận theo ngày</p>
        </div>
      </div>

      {/* Summary Stats */}
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
            <span className="text-xs font-medium uppercase tracking-wider">Tổng đơn hoàn thành</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-extrabold">{totalOrders} đơn</h3>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Số ngày có dữ liệu</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-extrabold">{dailyReports.length} ngày</h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo ngày (VD: 25/06)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value as 'week' | 'month' | 'all')}
              className="appearance-none bg-gray-50/50 border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="all">90 ngày qua</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-[14px] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Daily List */}
      <div className="space-y-4">
        {filteredReports.map((day, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
            
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  {formatDate(day.date)}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {day.completedOrdersCount} đơn hoàn thành
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phí cơ bản</p>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(day.baseFees)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Phí km</p>
                  <p className="text-sm font-bold text-gray-800">{formatCurrency(day.distanceFees)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tiền thưởng</p>
                  <p className="text-sm font-bold text-amber-600">{formatCurrency(day.bonus)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">TB mỗi đơn</p>
                  <p className="text-sm font-bold text-gray-600">
                    {day.completedOrdersCount > 0 
                      ? formatCurrency(day.totalIncome / day.completedOrdersCount) 
                      : '—'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="flex md:flex-col justify-between md:justify-center items-end border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 shrink-0 gap-2">
              <div className="text-left md:text-right">
                <p className="text-xs text-gray-400">Tổng thu nhập ngày</p>
                <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(day.totalIncome)}</p>
              </div>
            </div>

          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center">
            <PackageOpen className="w-16 h-16 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700">Không tìm thấy dữ liệu</h3>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm 
                ? 'Vui lòng điều chỉnh từ khóa tìm kiếm' 
                : 'Chưa có lịch sử giao hàng trong khoảng thời gian này'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
