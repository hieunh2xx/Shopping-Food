import { Package, BarChart3, Settings } from 'lucide-react';
import { Card } from '../components/common';

export function SellerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý cửa hàng</h1>
        <p className="text-gray-500">Tổng quan hoạt động kinh doanh</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Sản phẩm', value: '0', icon: Package, color: 'orange' },
          { label: 'Đơn hàng hôm nay', value: '0', icon: BarChart3, color: 'blue' },
          { label: 'Doanh thu', value: '0đ', icon: Settings, color: 'green' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100/50 flex items-center justify-center mb-4">
          <span className="text-3xl">🏪</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bảng điều khiển đang phát triển</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Tính năng quản lý sản phẩm, đơn hàng và doanh thu sẽ được cập nhật trong phiên bản tiếp theo.
        </p>
      </Card>
    </div>
  );
}
