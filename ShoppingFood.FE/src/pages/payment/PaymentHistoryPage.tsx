import { useEffect, useState } from 'react';
import { History, CreditCard } from 'lucide-react';
import { paymentService, type IPaymentHistoryItem } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import { Card } from '../../components/common';

const statusColor: Record<string, string> = {
  Completed: 'text-green-600 bg-green-50',
  Pending: 'text-amber-600 bg-amber-50',
  Expired: 'text-gray-500 bg-gray-100',
  Failed: 'text-red-600 bg-red-50',
};

export function PaymentHistoryPage() {
  const [items, setItems] = useState<IPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentService.getPaymentHistory().then(res => {
      if (!res.error && res.data?.items) setItems(res.data.items);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải lịch sử...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-8 h-8 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử thanh toán</h1>
          <p className="text-gray-500 text-sm">Các giao dịch SePay và thanh toán online</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">Chưa có giao dịch thanh toán nào.</Card>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.paymentId} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">
                    {item.paymentMethod} · {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </p>
                  {item.orderId && (
                    <p className="text-xs text-gray-400">Đơn: {item.orderId}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">{formatCurrency(item.amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status] ?? 'bg-gray-100'}`}>
                  {item.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
