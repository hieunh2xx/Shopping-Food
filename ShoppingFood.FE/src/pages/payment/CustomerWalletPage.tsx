import { useEffect, useState } from 'react';
import { Wallet, ArrowUpCircle, History, TrendingUp, TrendingDown, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { paymentService, type IWalletDto, type ITransactionDto } from '../../services/PaymentService';
import { formatCurrency, formatTransactionDescription } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

function getTransactionIcon(type: string, amount: number) {
  if (type === 'TopUp' || amount > 0) {
    return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-green-600" /></div>;
  }
  return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><TrendingDown className="w-5 h-5 text-red-600" /></div>;
}

function getTransactionBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    TopUp: { label: 'Nạp tiền', cls: 'bg-green-100 text-green-700' },
    Payment: { label: 'Thanh toán', cls: 'bg-orange-100 text-orange-700' },
    Refund: { label: 'Hoàn tiền', cls: 'bg-blue-100 text-blue-700' },
    Commission: { label: 'Hoa hồng', cls: 'bg-purple-100 text-purple-700' },
    Withdrawal: { label: 'Rút tiền', cls: 'bg-red-100 text-red-700' },
    ShipperIncome: { label: 'Thu nhập', cls: 'bg-emerald-100 text-emerald-700' },
    ShipperEarning: { label: 'Thu nhập', cls: 'bg-emerald-100 text-emerald-700' },
    CodCollection: { label: 'Thu hộ COD', cls: 'bg-amber-100 text-amber-700' },
    CodRepayment: { label: 'Nộp COD', cls: 'bg-indigo-100 text-indigo-700' },
  };
  const info = map[type] || { label: type, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>;
}

export function CustomerWalletPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [topUpAmount, setTopUpAmount] = useState('100000');
  const [loading, setLoading] = useState(true);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [take, setTake] = useState(10);


  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes] = await Promise.all([
        paymentService.getWallet(),
        paymentService.getTransactions({ take }),
      ]);
      if (!wRes.error && wRes.data) setWallet(wRes.data);
      if (!tRes.error && tRes.data) setTransactions(tRes.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [take]);

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (isNaN(amount) || amount < 10000) {
      toast.error('Số tiền nạp tối thiểu 10.000đ');
      return;
    }
    setTopUpLoading(true);
    try {
      const res = await paymentService.topUpWallet(amount);
      if (!res.error && res.data) {
        toast.success('Đang chuyển hướng sang trang thanh toán...');
        navigate(`${ROUTES.PAYMENT_SEPAY}?sessionId=${res.data.sessionId}&returnUrl=${encodeURIComponent(`${ROUTES.PROFILE}?tab=wallet`)}`);
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleLoadMore = () => {
    setTake(prev => prev + 10);
  };

  if (loading && !wallet) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
      <span className="ml-3 text-gray-500">Đang tải ví...</span>
    </div>
  );

  const displayAmount = parseInt(topUpAmount, 10);

  return (
    <div className="p-6">
      <div className="space-y-6 w-full">
        {/* Top Row: Wallet Header & Top Up */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Wallet Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-6 text-white shadow-xl shadow-orange-500/20 h-full">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Ví hệ thống</p>
                <p className="text-white/80 text-xs">{user?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Hoạt động</span>
            </div>
          </div>
          
          <div>
            <p className="text-orange-100 text-xs uppercase tracking-wider mb-1">Số dư hiện tại</p>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(wallet?.balance || 0)}</p>
          </div>
        </div>
      </div>

      {/* Top Up Section */}
      <Card className="p-6 border border-gray-100 h-full flex flex-col justify-center">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-green-600" />
          </div>
          Nạp tiền vào ví
        </h3>
        
        {/* Quick amount chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_AMOUNTS.map(v => (
            <button
              key={v}
              onClick={() => setTopUpAmount(String(v))}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                String(v) === topUpAmount
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              {formatCurrency(v)}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Nhập số tiền"
              className="text-lg font-semibold"
            />
            {!isNaN(displayAmount) && displayAmount > 0 && (
              <p className="text-xs text-gray-400 mt-1 ml-1">{formatCurrency(displayAmount)}</p>
            )}
          </div>
          <Button 
            onClick={handleTopUp} 
            disabled={topUpLoading}
            className="px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shrink-0"
          >
            {topUpLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Nạp tiền'}
          </Button>
        </div>
      </Card>
      </div>

      {/* Transaction History */}
      <Card className="p-6 border border-gray-100 w-full">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            Lịch sử giao dịch
          </h3>
          <button onClick={loadData} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-10">
            <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                {getTransactionIcon(tx.type, tx.amount)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">{formatTransactionDescription(tx.description)}</p>
                    {getTransactionBadge(tx.type)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
                    <span>Số dư: {formatCurrency(tx.balanceAfter)}</span>
                  </div>
                </div>
                <span className={`font-bold text-base shrink-0 ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            
            {/* Load more */}
            {transactions.length >= take && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors flex items-center justify-center gap-1 mt-2"
              >
                <ChevronDown className="w-4 h-4" />
                Xem thêm giao dịch
              </button>
            )}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}
