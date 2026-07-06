import { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, History } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { paymentService, type IWalletDto, type ITransactionDto } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';

export function CustomerWalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('100000');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes] = await Promise.all([
        paymentService.getWallet(),
        paymentService.getTransactions({ take: 20 }),
      ]);
      if (!wRes.error && wRes.data) setWallet(wRes.data);
      if (!tRes.error && tRes.data) setTransactions(tRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Số tiền nạp tối thiểu 10.000đ');
      return;
    }
    const res = await paymentService.topUpWallet(amount);
    if (!res.error) {
      toast.success('Nạp tiền thành công');
      loadData();
    } else {
      toast.error(res.message || 'Lỗi nạp tiền');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-8 h-8" />
          <div>
            <p className="text-orange-100 text-sm">Ví tích lũy hệ thống</p>
            <p className="text-3xl font-bold">{formatCurrency(wallet?.balance || 0)}</p>
          </div>
        </div>
        <p className="text-orange-100 text-sm">Xin chào {user?.fullName}</p>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowUpCircle className="w-5 h-5 text-green-500" /> Nạp tiền vào ví
        </h3>
        <div className="flex gap-3">
          <Input value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="Số tiền (VNĐ)" />
          <Button onClick={handleTopUp}>Nạp tiền</Button>
        </div>
        <div className="flex gap-2 mt-3">
          {[50000, 100000, 200000, 500000].map(v => (
            <button key={v} onClick={() => setTopUpAmount(String(v))} className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50">
              {formatCurrency(v)}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" /> Lịch sử giao dịch
        </h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có giao dịch nào</p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
