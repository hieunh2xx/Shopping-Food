import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '../../hooks';
import { Banknote, ArrowDownCircle, ArrowUpCircle, History, TrendingUp, TrendingDown, RefreshCw, ChevronDown, Building2, Sparkles, Wallet, CircleDollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Input, Pagination } from '../../components/common';
import { paymentService, type IWalletDto, type ITransactionDto } from '../../services/PaymentService';
import { ShipperOrderDetailModal } from '../../components/order/ShipperOrderDetailModal';
import { formatCurrency, formatTransactionDescription } from '../../utils/formatters';
import { ROUTES } from '../../routes/routeConfig';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function buildMonthOptions(monthsBack = 12) {
  const now = new Date();
  const options: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const label =
      i === 0
        ? `Tháng này (${start.getMonth() + 1}/${start.getFullYear()})`
        : i === 1
          ? `Tháng trước (${start.getMonth() + 1}/${start.getFullYear()})`
          : `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`;
    options.push({ key, label, start, end });
  }
  return options;
}

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
    MaintenanceFee: { label: 'Phí duy trì', cls: 'bg-rose-100 text-rose-700' },
    ShippingSubsidy: { label: 'Bù freeship', cls: 'bg-rose-100 text-rose-700' },
    Adjustment: { label: 'Điều chỉnh', cls: 'bg-gray-100 text-gray-700' },
  };
  const info = map[type] || { label: type, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>;
}

function TransactionHistory({
  transactions,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onSelect,
  chartData,
  monthKey,
  monthOptions,
  onMonthChange,
  title = 'Lịch sử giao dịch',
}: {
  transactions: ITransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onSelect?: (tx: ITransactionDto) => void;
  chartData?: { date: string; income: number; expense: number; net: number }[];
  monthKey?: string;
  monthOptions?: { key: string; label: string }[];
  onMonthChange?: (key: string) => void;
  title?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const chart = (chartData || []).map((d) => ({
    label: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    income: d.income,
    expense: d.expense,
  }));

  return (
    <Card className="p-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {monthOptions && onMonthChange && monthKey && (
            <select
              value={monthKey}
              onChange={(e) => onMonthChange(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          )}
          <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {chart.length > 0 && (
        <div className="h-48 mb-5 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Bar dataKey="income" name="Thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi / Nộp" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-10">
          <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Chưa có giao dịch nào</p>
        </div>
      ) : (
        <div className="space-y-1 mb-4">
          {transactions.map((tx) => {
            const clickable = !!(onSelect && tx.referenceId && (tx.referenceType === 'Order' || !tx.referenceType));
            return (
              <button
                key={tx.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect?.(tx)}
                className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl transition-colors text-left ${
                  clickable ? 'hover:bg-orange-50/70 cursor-pointer' : 'hover:bg-gray-50 cursor-default'
                }`}
              >
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
                {clickable && <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={(size) => {
          onPageSizeChange(size);
          onPageChange(1);
        }}
      />
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
  const navigate = useNavigate();
  const monthOptions = useMemo(() => buildMonthOptions(12), []);
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [dailyChart, setDailyChart] = useState<{ date: string; income: number; expense: number; net: number }[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
  const [topUpAmount, setTopUpAmount] = useState('200000');
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [monthKey, setMonthKey] = useState(monthOptions[0].key);
  const { confirm } = useConfirm();
  const selectedMonth = monthOptions.find((m) => m.key === monthKey) || monthOptions[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, tRes, wdRes] = await Promise.all([
        paymentService.getWallet(),
        paymentService.getTransactions({
          skip: (page - 1) * pageSize,
          take: pageSize,
          fromDate: selectedMonth.start.toISOString(),
          toDate: selectedMonth.end.toISOString(),
        }),
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
      if (!tRes.error && tRes.data) {
        setTransactions(tRes.data.items || []);
        setTxTotal(tRes.data.totalCount || 0);
        setDailyChart(tRes.data.dailyChart || []);
      }
      if (!wdRes.error && wdRes.data) setWithdrawals(wdRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, pageSize, monthKey]);
  useEffect(() => { setPage(1); }, [monthKey]);

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
        navigate(`${ROUTES.PAYMENT_SEPAY}?sessionId=${res.data.sessionId}&returnUrl=${encodeURIComponent(ROUTES.SELLER_WALLET)}`);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nạp tiền thất bại');
    } finally {
      setTopUpLoading(false);
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
                <p className="text-green-100 text-sm font-medium">Ví duy trì nhà hàng</p>
                <p className="text-white/80 text-xs">Phí duy trì & chiết khấu COD tự giao</p>
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
            {(wallet?.walletDebt ?? 0) > 0 && (
              <div className="mt-3 text-sm text-amber-100 flex justify-between gap-4">
                <span>Đang nợ (cần nạp bù)</span>
                <span className="font-bold">{formatCurrency(wallet?.walletDebt ?? 0)}</span>
              </div>
            )}
            {(wallet?.availableBalance ?? 0) > 0 && (
              <div className="mt-2 text-sm text-green-50 flex justify-between gap-4">
                <span>Có thể rút</span>
                <span className="font-bold">{formatCurrency(wallet?.availableBalance ?? 0)}</span>
              </div>
            )}
            {(wallet?.sellerMaintenanceFee ?? 0) > 0 && (
              <div className="mt-2 text-sm text-green-50/90 flex justify-between gap-4">
                <span>Phí duy trì / tháng</span>
                <span className="font-semibold">{formatCurrency(wallet?.sellerMaintenanceFee ?? 0)}</span>
              </div>
            )}
            {wallet?.nextMaintenanceDueAt && (
              <p className="text-green-100/80 text-xs mt-2">
                Kỳ phí tiếp theo: {new Date(wallet.nextMaintenanceDueAt).toLocaleDateString('vi-VN')}
              </p>
            )}
            <p className="text-green-100/90 text-xs mt-2 leading-relaxed max-w-md">
              COD tự giao: tiền mặt giữ tại quán, chiết khấu sàn trừ ví này. Đơn online tự giao vẫn cộng doanh thu vào ví để rút.
            </p>
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
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
          </div>
          Nạp tiền ví duy trì
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {[100000, 200000, 500000, 1000000].map(v => (
            <button
              key={v}
              onClick={() => setTopUpAmount(String(v))}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                String(v) === topUpAmount
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
              }`}
            >
              {formatCurrency(v)}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Số tiền nạp</label>
            <Input placeholder="Tối thiểu 10.000đ" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value.replace(/\D/g, ''))} />
          </div>
          <Button
            onClick={handleTopUp}
            disabled={topUpLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl"
          >
            {topUpLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Nạp qua SePay'}
          </Button>
        </div>
      </Card>
      </div>

      <Card className="p-6 border border-gray-100">
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

      <div className="w-full">
        <WithdrawalHistory withdrawals={withdrawals} onConfirm={handleConfirmWithdrawal} />
        <TransactionHistory
          transactions={transactions}
          totalCount={txTotal}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onRefresh={loadData}
          chartData={dailyChart}
          monthKey={monthKey}
          monthOptions={monthOptions}
          onMonthChange={setMonthKey}
        />
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHIPPER WALLET PAGE
   ═══════════════════════════════════════════════════════════ */

export function ShipperWalletPage() {
  const monthOptions = useMemo(() => buildMonthOptions(12), []);
  const [wallet, setWallet] = useState<IWalletDto | null>(null);
  const [transactions, setTransactions] = useState<ITransactionDto[]>([]);
  const [codTransactions, setCodTransactions] = useState<ITransactionDto[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [codTxTotal, setCodTxTotal] = useState(0);
  const [dailyChart, setDailyChart] = useState<{ date: string; income: number; expense: number; net: number }[]>([]);
  const [codChart, setCodChart] = useState<{ date: string; income: number; expense: number; net: number }[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [remittances, setRemittances] = useState<any[]>([]);
  const [repayNote, setRepayNote] = useState('');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankName: '', bankAccountNumber: '', bankAccountHolder: '' });
  const [loading, setLoading] = useState(true);
  const [repayLoading, setRepayLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [codPage, setCodPage] = useState(1);
  const [codPageSize, setCodPageSize] = useState(10);
  const [monthKey, setMonthKey] = useState(monthOptions[0].key);
  const [codMonthKey, setCodMonthKey] = useState(monthOptions[0].key);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const selectedMonth = monthOptions.find((m) => m.key === monthKey) || monthOptions[0];
  const selectedCodMonth = monthOptions.find((m) => m.key === codMonthKey) || monthOptions[0];

  const loadWalletMeta = async () => {
    const [wRes, wdRes, remRes] = await Promise.all([
      paymentService.getWallet(),
      paymentService.getWithdrawals(),
      paymentService.getCodRemittances(),
    ]);
    if (!wRes.error && wRes.data) {
      setWallet(wRes.data);
      if (wRes.data.bankName && !withdrawForm.bankName) {
        setWithdrawForm((prev) => ({
          ...prev,
          bankName: wRes.data!.bankName || '',
          bankAccountNumber: wRes.data!.bankAccountNumber || '',
          bankAccountHolder: wRes.data!.bankAccountHolder || '',
        }));
      }
    }
    if (!wdRes.error && wdRes.data) setWithdrawals(wdRes.data);
    if (!remRes.error && remRes.data) setRemittances(remRes.data.items || []);
  };

  const loadTransactions = async () => {
    const tRes = await paymentService.getTransactions({
      skip: (page - 1) * pageSize,
      take: pageSize,
      fromDate: selectedMonth.start.toISOString(),
      toDate: selectedMonth.end.toISOString(),
      excludeCod: true,
    });
    if (!tRes.error && tRes.data) {
      setTransactions(tRes.data.items || []);
      setTxTotal(tRes.data.totalCount || 0);
      setDailyChart(tRes.data.dailyChart || []);
    }
  };

  const loadCodTransactions = async () => {
    const tRes = await paymentService.getTransactions({
      skip: (codPage - 1) * codPageSize,
      take: codPageSize,
      fromDate: selectedCodMonth.start.toISOString(),
      toDate: selectedCodMonth.end.toISOString(),
      codOnly: true,
    });
    if (!tRes.error && tRes.data) {
      setCodTransactions(tRes.data.items || []);
      setCodTxTotal(tRes.data.totalCount || 0);
      setCodChart(tRes.data.dailyChart || []);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadWalletMeta(), loadTransactions(), loadCodTransactions()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, [page, pageSize, monthKey, codPage, codPageSize, codMonthKey]);
  useEffect(() => { setPage(1); }, [monthKey]);
  useEffect(() => { setCodPage(1); }, [codMonthKey]);

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

  const availableCod = wallet?.availableCodToRemit ?? Math.max(0, (wallet?.codCollectedAmount || 0) - (wallet?.pendingCodRemittance || 0));
  const pendingCod = wallet?.pendingCodRemittance || 0;
  const codCollected = wallet?.codCollectedAmount || 0;

  const handleRepay = async () => {
    if (availableCod <= 0) return toast.error('Không còn công nợ COD cần nộp');
    const ok = await confirm({
      title: 'Nộp toàn bộ COD',
      message: `Gửi yêu cầu nộp toàn bộ ${formatCurrency(availableCod)}? Công nợ chỉ trừ sau khi Admin/Điều phối duyệt.`,
      confirmText: 'Gửi yêu cầu',
      cancelText: 'Hủy',
    });
    if (!ok) return;

    setRepayLoading(true);
    try {
      const res = await paymentService.requestCodRemittance({
        amount: Math.round(availableCod),
        note: repayNote.trim() || undefined,
      });
      if (!res.error) {
        toast.success(res.message || `Đã gửi yêu cầu nộp ${formatCurrency(availableCod)}. Chờ duyệt.`);
        setRepayNote('');
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

  const openTxOrder = (tx: ITransactionDto) => {
    if (tx.referenceId) setSelectedOrderId(tx.referenceId);
  };

  if (loading && !wallet) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 text-violet-500 animate-spin" />
      <span className="ml-3 text-gray-500">Đang tải ví...</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-600 p-6 text-white shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
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
            <div className="mb-5">
              <p className="text-purple-100 text-xs uppercase tracking-wider mb-1">Số dư hiện tại</p>
              <p className="text-4xl font-black tracking-tight">{formatCurrency(wallet?.balance || 0)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-100 font-medium">COD thu hộ còn nợ</span>
                <span className="text-sm font-bold">{formatCurrency(codCollected)}</span>
              </div>
              {pendingCod > 0 && (
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span>Đang chờ duyệt</span>
                  <span className="font-semibold">{formatCurrency(pendingCod)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-purple-100/90 pt-1 border-t border-white/10">
                <span>Sẽ nộp toàn bộ</span>
                <span className="font-bold">{formatCurrency(availableCod)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-amber-600" />
              </div>
              Nộp tiền thu hộ COD
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Luôn kết toán hết số COD có thể nộp. Yêu cầu chờ Admin/Điều phối duyệt trước khi trừ công nợ.
            </p>
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-3">
              {availableCod > 0 ? (
                <>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(availableCod)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Số tiền sẽ gửi yêu cầu nộp toàn bộ</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-400">Không còn công nợ COD</p>
                  <p className="text-xs text-gray-400 mt-0.5">Hiện không có số tiền COD cần nộp.</p>
                </>
              )}
            </div>
            <Input
              placeholder="Ghi chú (tuỳ chọn): VD đã chuyển khoản lúc 10:00"
              value={repayNote}
              onChange={(e) => setRepayNote(e.target.value)}
              disabled={availableCod <= 0}
              className="mb-3"
            />
            <Button
              type="button"
              onClick={handleRepay}
              disabled={repayLoading || availableCod <= 0}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              {repayLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : availableCod > 0 ? `Nộp toàn bộ ${formatCurrency(availableCod)}` : 'Nộp tiền'}
            </Button>

            {remittances.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                <p className="text-sm font-semibold text-gray-800">Yêu cầu gần đây</p>
                {remittances.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(r.amount)}</p>
                      <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('vi-VN')}</p>
                      {r.status === 'Rejected' && r.rejectReason && (
                        <p className="text-xs text-red-600 mt-0.5">{r.rejectReason}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      r.status === 'Pending' ? 'bg-amber-100 text-amber-800'
                        : r.status === 'Approved' ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {r.status === 'Pending' ? 'Chờ duyệt' : r.status === 'Approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

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

      <WithdrawalHistory withdrawals={withdrawals} onConfirm={handleConfirmWithdrawal} />

      <TransactionHistory
        title="Lịch sử công nợ COD"
        transactions={codTransactions}
        totalCount={codTxTotal}
        page={codPage}
        pageSize={codPageSize}
        onPageChange={setCodPage}
        onPageSizeChange={setCodPageSize}
        onRefresh={loadData}
        onSelect={openTxOrder}
        chartData={codChart}
        monthKey={codMonthKey}
        monthOptions={monthOptions}
        onMonthChange={setCodMonthKey}
      />

      <TransactionHistory
        title="Lịch sử ví (thu nhập / rút tiền)"
        transactions={transactions}
        totalCount={txTotal}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onRefresh={loadData}
        onSelect={openTxOrder}
        chartData={dailyChart}
        monthKey={monthKey}
        monthOptions={monthOptions}
        onMonthChange={setMonthKey}
      />

      <ShipperOrderDetailModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}

