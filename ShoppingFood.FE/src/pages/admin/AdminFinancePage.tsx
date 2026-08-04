import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { Card, Button } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function AdminFinancePage() {
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, wdRes] = await Promise.all([
        paymentService.getReconciliation(),
        paymentService.getWithdrawals('Pending'),
      ]);
      if (!recRes.error) setReconciliation(recRes.data);
      if (!wdRes.error) setWithdrawals(wdRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (id: string, approve: boolean) => {
    const res = await paymentService.approveWithdrawal(id, approve);
    if (!res.error) {
      toast.success(approve ? 'Đã duyệt' : 'Đã từ chối');
      loadData();
    } else toast.error(res.message);
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  const summary = reconciliation?.summary;

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài chính</h1>
          <p className="text-sm text-gray-500 mt-1">Đối soát, chiết khấu sàn và duyệt rút tiền (UC-PAY-009, UC-PAY-015)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng doanh thu', value: formatCurrency(summary?.totalRevenue || 0), icon: DollarSign, color: 'blue' },
          { label: 'Chiết khấu sàn', value: formatCurrency(summary?.totalCommission || 0), icon: TrendingUp, color: 'orange' },
          { label: 'Trả nhà hàng', value: formatCurrency(summary?.totalSellerPayout || 0), icon: BarChart3, color: 'green' },
          { label: 'Đơn COD / Trả trước', value: `${summary?.codOrders || 0} / ${summary?.prepaidOrders || 0}`, icon: BarChart3, color: 'purple' },
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Yêu cầu rút tiền chờ duyệt (UC-PAY-009)</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm">Không có yêu cầu chờ duyệt</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 border rounded-xl">
                <div>
                  <p className="font-medium">{formatCurrency(w.amount)} — {w.ownerType}</p>
                  <p className="text-sm text-gray-500">{w.bankName} • {w.bankAccountNumber} • {w.bankAccountHolder}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(w.id, true)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleApprove(w.id, false)}>
                    <XCircle className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
