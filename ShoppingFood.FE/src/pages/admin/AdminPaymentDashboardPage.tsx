import { useEffect, useState } from 'react';
import { BarChart3, Clock, CheckCircle, XCircle, Layers, Webhook } from 'lucide-react';
import { Card } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency, getPaymentDisplayStatusLabel, getPaymentDisplayStatusColor } from '../../utils/formatters';

export function AdminPaymentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getPaymentDashboard().then(res => {
      if (!res.error) setData(res.data);
      else console.error(res.message);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải dashboard...</div>;

  const s = data?.summary ?? {};

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SePay / QR thanh toán</h1>
          <p className="text-sm text-gray-500 mt-1">Giám sát phiên QR, hàng đợi xử lý và webhook (không phải doanh thu seller)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Đã thanh toán', value: s.paid ?? 0, icon: CheckCircle, color: 'green' },
          { label: 'Đang chờ', value: s.pending ?? 0, icon: Clock, color: 'amber' },
          { label: 'Hết hạn QR', value: s.expired ?? 0, icon: XCircle, color: 'gray' },
          { label: 'Doanh thu online', value: formatCurrency(s.totalVolume ?? 0), icon: BarChart3, color: 'blue' },
        ].map((stat, i) => (
          <Card key={i} className="p-5">
            <stat.icon className={`w-6 h-6 text-${stat.color}-500 mb-2`} />
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold">Message Queue</h2>
          </div>
          <p className="text-sm text-gray-600">Hàng đợi chờ xử lý: <strong>{s.queuePending ?? 0}</strong></p>
          <p className="text-sm text-gray-600 mt-1">SePay sessions: <strong>{s.sepayCount ?? 0}</strong></p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Webhook className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold">Webhooks</h2>
          </div>
          <p className="text-sm text-gray-600">Nhận: <strong>{s.webhooksReceived ?? 0}</strong></p>
          <p className="text-sm text-gray-600 mt-1">Đã xử lý: <strong>{s.webhooksProcessed ?? 0}</strong></p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-4">Phiên thanh toán gần đây</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 pr-4">Mã hóa đơn</th>
                <th className="pb-2 pr-4">Số tiền</th>
                <th className="pb-2 pr-4">Trạng thái</th>
                <th className="pb-2">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentSessions ?? []).map((row: any) => (
                <tr key={row.paymentId} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs">{row.invoiceNumber}</td>
                  <td className="py-2 pr-4">{formatCurrency(row.amount)}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentDisplayStatusColor(row.status)}`}>
                      {getPaymentDisplayStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{new Date(row.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
