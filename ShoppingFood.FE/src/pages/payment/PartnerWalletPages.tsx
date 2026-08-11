import { useEffect, useState } from 'react';
import { useConfirm } from '../../hooks';
import { Banknote, ArrowDownCircle, History, TrendingUp, TrendingDown, RefreshCw, ChevronDown, Building2, Sparkles, Wallet, ShieldAlert, CircleDollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { paymentService, type IWalletDto, type ITransactionDto } from '../../services/PaymentService';
import { formatCurrency, formatTransactionDescription } from '../../utils/formatters';
import toast from 'react-hot-toast';

/* ─── Shared helpers ─── */

function getTransactionIcon(type: string, amount: number) {
  if (type === 'TopUp' || type === 'ShipperIncome' || type === 'Commission' || amount > 0) {
    return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-green-600" /></div>;
  }
  if (type === 'Refund') {
    return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><RefreshCw className="w-5 h-5 text-blue-600" /></div>;
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
    CodRemittance: { label: 'Nộp COD', cls: 'bg-indigo-100 text-indigo-700' },
    SellerPayout: { label: 'Thanh toán đơn', cls: 'bg-green-100 text-green-700' },
    ShippingSubsidy: { label: 'Bù freeship', cls: 'bg-rose-100 text-rose-700' },
    Adjustment: { label: 'Điều chỉnh', cls: 'bg-gray-100 text-gray-700' },
  };
  const info = map[type] || { label: type, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>;
}

function TransactionHistory({ transactions, take, onLoadMore, onRefresh }: { transactions: ITransactionDto[]; take: number; onLoadMore: () => void; onRefresh: () => void }) {
  return (
    <Card className="p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          Lịch sử giao dịch
        </h3>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
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
          {transactions.length >= take && (
            <button
              onClick={onLoadMore}
              className="w-full py-3 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors flex items-center justify-center gap-1 mt-2"
            >
              <ChevronDown className="w-4 h-4" />
              Xem thêm giao dịch
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

function WithdrawalHistory({ withdrawals, onConfirm }: { withdrawals: any[]; onConfirm: (id: string, isReceived: boolean) => void }) {
  if (withdrawals.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'Approved': return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-800">Đã chuyển</span>;
      case 'Rejected': return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-red-100 text-red-800">Từ chối</span>;
      case 'Completed': return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-green-100 text-green-800">Hoàn thành</span>;
      case 'Disputed': return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-red-100 text-red-800 border border-red-200">Đang khiếu nại</span>;
      default: return null;
    }
  };

  return (
    <Card className="p-6 border border-gray-100 mb-6">
      <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg mb-5">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <ArrowDownCircle className="w-5 h-5 text-purple-600" />
        </div>
        Lịch sử rút tiền
      </h3>
      <div className="space-y-3">
        {withdrawals.map((w) => (
          <div key={w.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-gray-900 text-lg">{formatCurrency(w.amount)}</p>
                <p className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleString('vi-VN')} • Mã: {w.id.substring(0,8)}</p>
              </div>
              {getStatusBadge(w.status)}
            </div>
            
            {(w.status === 'Approved' || w.status === 'Completed' || w.status === 'Disputed') && w.transferProofImageUrl && (
              <a href={w.transferProofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mb-2 inline-block">
                Xem bill chuyển khoản từ Admin
              </a>
            )}

            {w.status === 'Rejected' && w.rejectReason && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mt-2">Lý do từ chối: {w.rejectReason}</p>
            )}
            
            {w.status === 'Approved' && (
              <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row items-center gap-3 justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">Bạn đã nhận được tiền chưa?</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onConfirm(w.id, true)} className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                    <CheckCircle className="w-4 h-4 mr-1" /> Đã nhận tiền
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onConfirm(w.id, false)} className="text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap">
                    <XCircle className="w-4 h-4 mr-1" /> Chưa nhận được
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   SELLER WALLET PAGE
   ═══════════════════════════════════════════════════════════ */

export function SellerWalletPage() {
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [take, setTake] = useState(10);
  const { confirm } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes, wdRes] = await Promise.all([
        paymentService.getWallet(),
        paymentService.getTransactions({ take }),
        paymentService.getWithdrawals()
      ]);
      if (!wRes.error && wRes.data) {
        setWallet(wRes.data);
        if (wRes.data.bankName && !withdrawForm.bankName) {
          setWithdrawForm(prev => ({
            ...prev,
            bankName: wRes.data!.bankName || '',
            bankAccountNumber: wRes.data!.bankAccountNumber || '',
            bankAccountHolder: wRes.data!.bankAccountHolder || '',
          }));
        }
      }
      if (!tRes.error && tRes.data) setTransactions(tRes.data);
      if (!wdRes.error && wdRes.data) setWithdrawals(wdRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [take]);

  const handleConfirmWithdrawal = async (id: string, isReceived: boolean) => {
    if (!isReceived) {
      const confirmed = await confirm({
        title: 'Xác nhận khiếu nại',
        message: 'Bạn chắc chắn chưa nhận được tiền và muốn khiếu nại?',
        isDanger: true,
        confirmText: 'Khiếu nại',
        cancelText: 'Hủy'
      });
      if (!confirmed) return;
    }
    
    const res = await paymentService.confirmWithdrawal({ withdrawalId: id, isReceived });
    if (!res.error) {
      toast.success(isReceived ? 'Xác nhận thành công' : 'Đã gửi khiếu nại tới Admin');
      loadData();
    } else toast.error(res.message);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || !withdrawForm.bankName || !withdrawForm.bankAccountNumber || !withdrawForm.bankAccountHolder) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (amount < 50000) {
      toast.error('Số tiền rút tối thiểu 50.000đ');
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await paymentService.requestWithdrawal({
        amount,
        bankName: withdrawForm.bankName,
        bankAccountNumber: withdrawForm.bankAccountNumber,
        bankAccountHolder: withdrawForm.bankAccountHolder,
      });
      if (!res.error) {
        toast.success('Yêu cầu rút tiền đã được gửi');
        setWithdrawForm(prev => ({ ...prev, amount: '' }));
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading && !wallet) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 text-green-500 animate-spin" />
      <span className="ml-3 text-gray-500">Đang tải ví...</span>
    </div>
  );

  return (
    <div className="p-6">
      <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-6 text-white shadow-xl shadow-green-500/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-medium">Ví nhà hàng</p>
                <p className="text-white/80 text-xs">Quản lý doanh thu</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Hoạt động</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-green-100 text-xs uppercase tracking-wider mb-1">Số dư hiện tại</p>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(wallet?.balance || 0)}</p>
          </div>

          {wallet?.bankName && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <Building2 className="w-4 h-4 text-green-200" />
              <span className="text-sm text-green-50">{wallet.bankName} • ****{wallet.bankAccountNumber?.slice(-4)}</span>
            </div>
          )}
        </div>
      </div>

      <Card className="p-6 border border-gray-100 h-full">
        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 text-orange-600" />
          </div>
          Rút tiền về ngân hàng
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {[100000, 500000, 1000000, 2000000].map(v => (
            <button
              key={v}
              onClick={() => setWithdrawForm(p => ({ ...p, amount: String(v) }))}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                String(v) === withdrawForm.amount
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
              }`}
            >
              {formatCurrency(v)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Số tiền rút</label>
            <Input placeholder="Nhập số tiền (tối thiểu 50.000đ)" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))} />
            {withdrawForm.amount && !isNaN(parseInt(withdrawForm.amount)) && (
              <p className="text-xs text-gray-400 mt-1 ml-1">{formatCurrency(parseInt(withdrawForm.amount))}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tên ngân hàng</label>
            <Input placeholder="VD: Vietcombank, MB Bank, ..." value={withdrawForm.bankName} onChange={e => setWithdrawForm(p => ({ ...p, bankName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Số tài khoản</label>
              <Input placeholder="Nhập số tài khoản" value={withdrawForm.bankAccountNumber} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Chủ tài khoản</label>
              <Input placeholder="Tên chủ tài khoản" value={withdrawForm.bankAccountHolder} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountHolder: e.target.value }))} />
            </div>
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl"
          >
            {withdrawLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Gửi yêu cầu rút tiền'}
          </Button>
        </div>
      </Card>
      </div>
      </div>

      <div className="w-full">
        <WithdrawalHistory withdrawals={withdrawals} onConfirm={handleConfirmWithdrawal} />
        <TransactionHistory transactions={transactions} take={take} onLoadMore={() => setTake(prev => prev + 10)} onRefresh={loadData} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHIPPER WALLET PAGE
   ═══════════════════════════════════════════════════════════ */

export function ShipperWalletPage() {
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
  const [loading, setLoading] = useState(true);
  const [repayLoading, setRepayLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [take, setTake] = useState(10);
  const { confirm } = useConfirm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes, wdRes] = await Promise.all([
        paymentService.getWallet(),
        paymentService.getTransactions({ take }),
        paymentService.getWithdrawals()
      ]);
      if (!wRes.error && wRes.data) {
        setWallet(wRes.data);
        const debt = Number(wRes.data.codCollectedAmount || 0);
        setRepayAmount(debt > 0 ? String(Math.round(debt)) : '');
        if (wRes.data.bankName && !withdrawForm.bankName) {
          setWithdrawForm(prev => ({
            ...prev,
            bankName: wRes.data!.bankName || '',
            bankAccountNumber: wRes.data!.bankAccountNumber || '',
            bankAccountHolder: wRes.data!.bankAccountHolder || '',
          }));
        }
      }
      if (!tRes.error && tRes.data) setTransactions(tRes.data);
      if (!wdRes.error && wdRes.data) setWithdrawals(wdRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [take]);

  const handleConfirmWithdrawal = async (id: string, isReceived: boolean) => {
    if (!isReceived) {
      const confirmed = await confirm({
        title: 'Xác nhận khiếu nại',
        message: 'Bạn chắc chắn chưa nhận được tiền và muốn khiếu nại?',
        isDanger: true,
        confirmText: 'Khiếu nại',
        cancelText: 'Hủy'
      });
      if (!confirmed) return;
    }
    
    const res = await paymentService.confirmWithdrawal({ withdrawalId: id, isReceived });
    if (!res.error) {
      toast.success(isReceived ? 'Xác nhận thành công' : 'Đã gửi khiếu nại tới Admin');
      loadData();
    } else toast.error(res.message);
  };

  const handleRepay = async () => {
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return toast.error('Nhập số tiền hợp lệ');
    setRepayLoading(true);
    try {
      const res = await paymentService.repayShipperDebt(amount);
      if (!res.error) {
        toast.success(`Đã nộp ${formatCurrency(res.data?.repaid || amount)} công nợ COD`);
        setRepayAmount('');
        loadData();
      } else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setRepayLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || !withdrawForm.bankName || !withdrawForm.bankAccountNumber || !withdrawForm.bankAccountHolder) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await paymentService.requestWithdrawal({
        amount,
        bankName: withdrawForm.bankName,
        bankAccountNumber: withdrawForm.bankAccountNumber,
        bankAccountHolder: withdrawForm.bankAccountHolder,
      });
      if (!res.error) {
        toast.success('Yêu cầu rút tiền đã gửi');
        setWithdrawForm(prev => ({ ...prev, amount: '' }));
        loadData();
      } else toast.error(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const codCollected = wallet?.codCollectedAmount || 0;
  const debtLimit = wallet?.debtLimit || 5000000;
  const debtExceeded = codCollected >= debtLimit;
  const codPercentage = Math.min((codCollected / debtLimit) * 100, 100);

  if (loading && !wallet) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
      <span className="ml-3 text-gray-500">Đang tải ví...</span>
    </div>
  );

  return (
    <div className="p-6">
      <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Left Column: Info & Forms */}
      <div className="space-y-6 h-full flex flex-col">
      {/* Wallet Header */}
      <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-6 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-purple-100 text-sm font-medium">Ví tài xế</p>
                <p className="text-white/80 text-xs">Quản lý thu nhập & COD</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Hoạt động</span>
            </div>
          </div>

          <div className="mb-5 shrink-0">
            <p className="text-purple-100 text-xs uppercase tracking-wider mb-1">Số dư hiện tại</p>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(wallet?.balance || 0)}</p>
          </div>

          {/* COD progress */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mt-auto shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-100 font-medium">COD thu hộ</span>
              <span className="text-sm font-bold">{formatCurrency(codCollected)} / {formatCurrency(debtLimit)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  debtExceeded ? 'bg-red-400' : codPercentage > 70 ? 'bg-amber-400' : 'bg-green-400'
                }`}
                style={{ width: `${codPercentage}%` }}
              />
            </div>
            <p className="text-xs text-purple-200 mt-1.5">{codPercentage.toFixed(0)}% hạn mức đã sử dụng</p>
          </div>
        </div>
      </div>

      {/* Debt Warning */}
      {debtExceeded && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-800 mb-1">Vượt hạn mức thu hộ COD!</p>
            <p className="text-sm text-red-600">Bạn cần nộp tiền COD trước khi nhận đơn hàng mới. Vui lòng nộp tiền ngay bên dưới.</p>
          </div>
        </div>
      )}
      </div>
      <div className="space-y-6">

      {/* Repay COD Section */}
      <Card className="p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <CircleDollarSign className="w-5 h-5 text-amber-600" />
          </div>
          Nộp tiền thu hộ COD
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder={codCollected > 0 ? `Tối đa ${formatCurrency(codCollected)}` : 'Không còn công nợ COD'}
              value={repayAmount}
              onChange={e => setRepayAmount(e.target.value.replace(/\D/g, ''))}
              disabled={codCollected <= 0}
            />
            {repayAmount && !isNaN(parseInt(repayAmount)) && (
              <p className="text-xs text-gray-400 mt-1 ml-1">{formatCurrency(parseInt(repayAmount))}</p>
            )}
            {codCollected <= 0 && (
              <p className="text-xs text-gray-400 mt-1 ml-1">Hiện không có số tiền COD cần nộp.</p>
            )}
          </div>
          <Button
            type="button"
            onClick={handleRepay}
            disabled={repayLoading || codCollected <= 0 || parseFloat(repayAmount || '0') <= 0}
            className="px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shrink-0 disabled:opacity-50"
          >
            {repayLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Nộp tiền'}
          </Button>
        </div>
        {codCollected > 0 && (
          <button
            type="button"
            onClick={() => {
              setRepayAmount(String(Math.round(codCollected)));
              // Nộp ngay toàn bộ khi bấm
            }}
            className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-semibold hover:underline"
          >
            Điền toàn bộ ({formatCurrency(codCollected)})
          </button>
        )}
        {codCollected > 0 && (
          <Button
            type="button"
            onClick={async () => {
              setRepayAmount(String(Math.round(codCollected)));
              setRepayLoading(true);
              try {
                const res = await paymentService.repayShipperDebt(Math.round(codCollected));
                if (!res.error) {
                  toast.success(`Đã nộp ${formatCurrency(res.data?.repaid || codCollected)} công nợ COD`);
                  setRepayAmount('');
                  loadData();
                } else toast.error(res.message);
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Nộp COD thất bại');
              } finally {
                setRepayLoading(false);
              }
            }}
            disabled={repayLoading}
            className="mt-3 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
          >
            {repayLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `Nộp toàn bộ ${formatCurrency(codCollected)}`}
          </Button>
        )}
      </Card>

      {/* Withdrawal Form */}
      <Card className="p-6 border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 text-orange-600" />
          </div>
          Rút tiền về ngân hàng
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Số tiền rút</label>
            <Input placeholder="Nhập số tiền" value={withdrawForm.amount} onChange={e => setWithdrawForm(p => ({ ...p, amount: e.target.value.replace(/\D/g, '') }))} />
            {withdrawForm.amount && !isNaN(parseInt(withdrawForm.amount)) && (
              <p className="text-xs text-gray-400 mt-1 ml-1">{formatCurrency(parseInt(withdrawForm.amount))}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Tên ngân hàng</label>
            <Input placeholder="VD: Vietcombank, MB Bank, ..." value={withdrawForm.bankName} onChange={e => setWithdrawForm(p => ({ ...p, bankName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Số tài khoản</label>
              <Input placeholder="Nhập số tài khoản" value={withdrawForm.bankAccountNumber} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountNumber: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Chủ tài khoản</label>
              <Input placeholder="Tên chủ tài khoản" value={withdrawForm.bankAccountHolder} onChange={e => setWithdrawForm(p => ({ ...p, bankAccountHolder: e.target.value }))} />
            </div>
          </div>
          <Button
            onClick={handleWithdraw}
            disabled={withdrawLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl"
          >
            {withdrawLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Gửi yêu cầu rút tiền'}
          </Button>
        </div>
      </Card>
      </div>
      </div>
      </div>

      {/* Right Column: Transaction History */}
      <div className="w-full">
        <WithdrawalHistory withdrawals={withdrawals} onConfirm={handleConfirmWithdrawal} />
        {/* Transaction History */}
        <TransactionHistory transactions={transactions} take={take} onLoadMore={() => setTake(prev => prev + 10)} onRefresh={loadData} />
      </div>
    </div>
  );
}
