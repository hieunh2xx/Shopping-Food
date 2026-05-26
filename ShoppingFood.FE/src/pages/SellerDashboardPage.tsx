import { ShoppingBag, Star, TrendingUp } from 'lucide-react';
import { Card } from '../components/common';

export function SellerDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý cửa hàng</h1>
        <p className="text-gray-500">Tổng quan doanh thu và đơn hàng</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Đơn hàng hôm nay', value: '0', icon: ShoppingBag, color: 'orange' },
          { label: 'Doanh thu', value: '0 đ', icon: TrendingUp, color: 'green' },
          { label: 'Đánh giá', value: '0.0', icon: Star, color: 'yellow' },
        ].map((stat, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 text-center bg-white border border-gray-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-3xl">
          👨‍🍳
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Trang cửa hàng đang phát triển</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Tính năng quản lý sản phẩm, đơn hàng và thống kê doanh thu sẽ sớm được cập nhật.
        </p>
      </Card>
    </div>
  );
}
