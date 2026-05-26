import { Users, Package, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common';

export function AdminDashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản trị hệ thống</h1>
        <p className="text-gray-500">Tổng quan hoạt động hệ thống</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Người dùng', value: '0', icon: Users, color: 'blue' },
          { label: 'Sản phẩm chờ duyệt', value: '0', icon: Package, color: 'orange' },
          { label: 'Hồ sơ đối tác chờ', value: '0', icon: ShieldCheck, color: 'green' },
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
          <span className="text-3xl">âš™ï¸ </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Trang quản trị đang phát triển</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Tính năng duyệt hồ sơ đối tác, duyệt sản phẩm và quản lý người dùng sẽ được cập nhật.
        </p>
      </Card>
    </div>
  );
}
