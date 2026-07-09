import { useState, useEffect, useCallback } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Loader2
} from 'lucide-react';
import { shipperService } from '../../services';
import type { IShipperIncomeReportDto, IDailyIncomeReportDto } from '../../interfaces/IShipper';

export function ShipperIncomePage() {
  const [dateRange, setDateRange] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [loading, setLoading] = useState(true);
  const [incomeReport, setIncomeReport] = useState<IShipperIncomeReportDto | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateRange === 'Weekly') {
      // Start of this week (Monday)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else {
      // Start of this month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  }, [dateRange]);

  const fetchIncomeReport = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await shipperService.getIncomeReport(startDate, endDate);
      if (res.data) {
        setIncomeReport(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch income report:', err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchIncomeReport();
  }, [fetchIncomeReport]);

  const totalIncome = incomeReport?.totalIncome ?? 0;
  const totalBaseFees = incomeReport?.totalBaseFees ?? 0;
  const totalDistanceFees = incomeReport?.totalDistanceFees ?? 0;
  const totalBonuses = incomeReport?.totalBonuses ?? 0;
  const completedOrders = incomeReport?.completedOrdersCount ?? 0;
  const dailyReports: IDailyIncomeReportDto[] = incomeReport?.dailyReports ?? [];

  // Calculate chart data from daily reports
  const chartData = dailyReports.map(d => d.totalIncome);
  const chartLabels = dailyReports.map(d => {
    const date = new Date(d.date);
    if (dateRange === 'Weekly') {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    } else {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
  });

  const avgIncomePerOrder = completedOrders > 0 ? totalIncome / completedOrders : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Đang tải báo cáo thu nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo thu nhập</h1>
          <p className="text-gray-500 text-sm mt-0.5">Theo dõi doanh thu giao hàng và tiền thưởng của bạn</p>
        </div>

        <div className="inline-flex bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setDateRange('Weekly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              dateRange === 'Weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setDateRange('Monthly')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              dateRange === 'Monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Main Income Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Total Revenue */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/10 flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-sm font-semibold opacity-80 uppercase tracking-wider block">Tổng thu nhập ròng</span>
            <h2 className="text-4xl font-black mt-2">{formatCurrency(totalIncome)}</h2>
          </div>

          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-white/20 mt-4">
            <div>
              <span className="text-[11px] opacity-75 block">Phí cơ bản</span>
              <span className="font-extrabold text-sm mt-0.5 block">{formatCurrency(totalBaseFees)}</span>
            </div>
            <div>
              <span className="text-[11px] opacity-75 block">Phí theo Km</span>
              <span className="font-extrabold text-sm mt-0.5 block">{formatCurrency(totalDistanceFees)}</span>
            </div>
            <div>
              <span className="text-[11px] opacity-75 block">Tiền Thưởng</span>
              <span className="font-extrabold text-sm mt-0.5 block">{formatCurrency(totalBonuses)}</span>
            </div>
            <div>
              <span className="text-[11px] opacity-75 block">Đơn hoàn thành</span>
              <span className="font-extrabold text-sm mt-0.5 block">{completedOrders} đơn</span>
            </div>
          </div>
        </div>

        {/* Right Card: Performance breakdown */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between gap-4">
          <h3 className="font-bold text-gray-900 text-base">Tổng kết hiệu suất</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Tổng số chuyến giao</span>
              <span className="font-bold text-gray-800">{completedOrders} chuyến</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Thu nhập TB / đơn</span>
              <span className="font-bold text-emerald-600">{formatCurrency(avgIncomePerOrder)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Phí cơ bản trung bình</span>
              <span className="font-bold text-gray-800">{formatCurrency(completedOrders > 0 ? totalBaseFees / completedOrders : 0)}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between mt-2">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider font-bold">Kỳ báo cáo</span>
              <span className="text-xs font-semibold text-gray-700">{dateRange === 'Weekly' ? 'Tuần này' : 'Tháng này'}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              totalIncome > 0 
                ? "bg-green-100 text-green-800" 
                : "bg-amber-100 text-amber-800"
            }`}>
              {totalIncome > 0 ? 'Có dữ liệu' : 'Chưa có dữ liệu'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Biểu đồ biến động thu nhập</h3>
            <p className="text-gray-400 text-xs mt-0.5">Biểu diễn dòng tiền theo {dateRange === 'Weekly' ? 'thứ trong tuần' : 'ngày trong tháng'}</p>
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> {dailyReports.length} ngày có dữ liệu
          </span>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-64 mt-4 relative">
          {chartData.length > 0 ? (
            <div className="absolute inset-0 flex items-end justify-between px-4 pb-6">
              {chartData.map((val, idx) => {
                const maxVal = Math.max(...chartData, 1);
                const heightPercent = maxVal > 0 ? (val / maxVal) * 80 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    {/* Tooltip on hover */}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg absolute -translate-y-12 whitespace-nowrap">
                      {formatCurrency(val)} ({dailyReports[idx]?.completedOrdersCount ?? 0} đơn)
                    </span>
                    
                    {/* Animated Bar */}
                    <div 
                      style={{ height: `${heightPercent}%`, minHeight: val > 0 ? '8px' : '0px' }} 
                      className="w-8 sm:w-12 bg-gradient-to-t from-orange-500 to-amber-400 rounded-xl group-hover:from-orange-600 group-hover:to-amber-500 transition-all shadow-md shadow-orange-500/10"
                    />
                    
                    {/* Labels */}
                    <span className="text-xs text-gray-500 font-semibold mt-1">
                      {chartLabels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Chưa có dữ liệu thu nhập trong khoảng thời gian này</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily report breakdown */}
      {dailyReports.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg mb-4">Chi tiết theo ngày</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Ngày</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Đơn hoàn thành</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Phí cơ bản</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Phí Km</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Thưởng</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-400 font-bold uppercase tracking-wider">Tổng thu nhập</th>
                </tr>
              </thead>
              <tbody>
                {dailyReports.map((day, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-800">
                      {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">{day.completedOrdersCount} đơn</td>
                    <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(day.baseFees)}</td>
                    <td className="py-3 px-2 text-right text-gray-600">{formatCurrency(day.distanceFees)}</td>
                    <td className="py-3 px-2 text-right text-amber-600 font-medium">{formatCurrency(day.bonus)}</td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-600">{formatCurrency(day.totalIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
