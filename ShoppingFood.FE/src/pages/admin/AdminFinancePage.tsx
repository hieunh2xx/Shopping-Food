import { useEffect, useState, useRef, useCallback } from 'react';
import { useConfirm } from '../../hooks';
import { DollarSign, TrendingUp, CheckCircle, XCircle, BarChart3, AlertCircle, Truck, Wallet } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { Image as ImageIcon } from 'lucide-react';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type PeriodDays = 7 | 30;

export function AdminFinancePage() {
  const [days, setDays] = useState<PeriodDays>(30);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [disputedWithdrawals, setDisputedWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (days - 1));

      const [recRes, wdRes, dispRes] = await Promise.all([
        paymentService.getReconciliation({
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
        }),
        paymentService.getWithdrawals('Pending'),
        paymentService.getWithdrawals('Disputed'),
      ]);
      if (!recRes.error) setReconciliation(recRes.data);
      if (!wdRes.error) setWithdrawals(wdRes.data || []);
      if (!dispRes.error) setDisputedWithdrawals(dispRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenApprove = (w: any) => {
    setCurrentWithdrawal(w);
    setProofFile(null);
    setApproveModalOpen(true);
  };

  const handleOpenReject = (w: any) => {
    setCurrentWithdrawal(w);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!proofFile) return toast.error('Vui lòng upload ảnh bill chuyển khoản');

    setProcessing(true);
    try {
      const uploadRes = await paymentService.uploadWithdrawalProof(proofFile);
      if (uploadRes.error) {
        toast.error(uploadRes.message || 'Lỗi upload ảnh');
        return;
      }

      const imageUrl = uploadRes.data?.imageUrl;
      const res = await paymentService.approveWithdrawal({
        withdrawalId: currentWithdrawal.id,
        approve: true,
        transferProofImageUrl: imageUrl
      });

      if (!res.error) {
        toast.success(res.message || 'Đã duyệt');
        setApproveModalOpen(false);
        loadData();
      } else toast.error(res.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return toast.error('Vui lòng nhập lý do từ chối');

    setProcessing(true);
    try {
      const res = await paymentService.approveWithdrawal({
        withdrawalId: currentWithdrawal.id,
        approve: false,
        rejectReason
      });

      if (!res.error) {
        toast.success(res.message || 'Đã từ chối');
        setRejectModalOpen(false);
        loadData();
      } else toast.error(res.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleForceComplete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Cưỡng chế chốt đơn',
      message: 'Bạn có chắc chắn đã chuyển khoản và muốn chốt đơn này?',
      isDanger: true,
      confirmText: 'Chốt đơn',
      cancelText: 'Hủy'
    });
    if (!isConfirmed) return;

    setProcessing(true);
    try {
      const res = await paymentService.forceCompleteWithdrawal({ withdrawalId: id });
      if (!res.error) {
        toast.success(res.message || 'Hoàn thành ép buộc thành công');
        loadData();
      } else toast.error(res.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  const summary = reconciliation?.summary;
  const chartData = reconciliation?.chartData || [];
  const period = reconciliation?.period;

  const chartTooltipFormatter = (value: unknown, name: unknown) => {
    const key = String(name);
    const labels: Record<string, string> = {
      gmv: 'GMV',
      platformRevenue: 'Doanh thu sàn',
      sellerPayout: 'Trả seller',
      shipperIncome: 'Trả shipper',
      ordersCount: 'Số đơn',
    };
    const num = Number(value ?? 0);
    if (key === 'ordersCount') return [num, labels[key]];
    return [formatCurrency(num), labels[key] || key];
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài chính</h1>
          <p className="text-sm text-gray-500 mt-1">
            Đối soát dòng tiền nền tảng · Duyệt rút tiền seller/shipper
            {period?.from && period?.to && (
              <span className="ml-1">
                ({new Date(period.from).toLocaleDateString('vi-VN')} – {new Date(period.to).toLocaleDateString('vi-VN')})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDays(7)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${days === 7 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            7 Ngày
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${days === 30 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            30 Ngày
          </button>
        </div>
      </div>

      <div className="mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Phân bổ thanh toán trong kỳ</h2>
        <p className="text-sm text-gray-500 mb-4">
          Số liệu đơn đã đối soát — dùng để biết platform giữ bao nhiêu, cần trả seller/shipper bao nhiêu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'GMV (tổng đơn)', value: formatCurrency(summary?.totalRevenue || 0), icon: DollarSign, hint: `${summary?.totalOrders || 0} đơn đã đối soát`, tone: 'slate' },
          { label: 'Doanh thu sàn', value: formatCurrency(summary?.totalCommission || 0), icon: TrendingUp, hint: `VAT ~ ${formatCurrency(summary?.estimatedTax || 0)}`, tone: 'orange' },
          { label: 'Cần trả seller', value: formatCurrency(summary?.totalSellerPayout || 0), icon: BarChart3, hint: 'Tiền món sau hoa hồng', tone: 'green' },
          { label: 'Cần trả shipper', value: formatCurrency(summary?.totalShipperIncome || 0), icon: Truck, hint: 'Thu nhập giao hàng', tone: 'blue' },
          { label: 'Sàn sau VAT', value: formatCurrency(summary?.netPlatformRevenue || 0), icon: Wallet, hint: 'Doanh thu thực ước tính', tone: 'amber' },
          { label: 'COD / Trả trước', value: `${summary?.codOrders || 0} / ${summary?.prepaidOrders || 0}`, icon: BarChart3, hint: 'Số đơn theo PTTT', tone: 'purple' },
        ].map((stat, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <stat.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.hint}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Biểu đồ dòng tiền theo ngày trong kỳ</h2>
          <p className="text-sm text-gray-500">GMV · Doanh thu sàn · Trả seller · Trả shipper</p>
        </div>
        <div className="h-80">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Chưa có đơn đã đối soát trong kỳ này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={(val) => `${val / 1000}k`} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={chartTooltipFormatter}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="gmv" name="GMV" stroke="#64748b" strokeWidth={2} dot={false} />
                <Line yAxisId="left" type="monotone" dataKey="platformRevenue" name="Doanh thu sàn" stroke="#ea580c" strokeWidth={3} />
                <Line yAxisId="left" type="monotone" dataKey="sellerPayout" name="Trả seller" stroke="#16a34a" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="shipperIncome" name="Trả shipper" stroke="#2563eb" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="ordersCount" name="Số đơn" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

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
                  <Button size="sm" onClick={() => handleOpenApprove(w)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleOpenReject(w)}>
                    <XCircle className="w-4 h-4 mr-1" /> Từ chối
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {disputedWithdrawals.length > 0 && (
        <Card className="p-6 mt-6 border-red-200 bg-red-50/30">
          <h2 className="text-lg font-semibold mb-4 text-red-700 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Yêu cầu rút tiền bị khiếu nại
          </h2>
          <div className="space-y-3">
            {disputedWithdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between p-4 border border-red-200 bg-white rounded-xl">
                <div>
                  <p className="font-medium text-red-700">{formatCurrency(w.amount)} — {w.ownerType}</p>
                  <p className="text-sm text-gray-500">{w.bankName} • {w.bankAccountNumber} • {w.bankAccountHolder}</p>
                  <p className="text-xs text-red-600 mt-1">Lý do: User báo chưa nhận được tiền</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => handleForceComplete(w.id)}>
                    Cưỡng chế chốt đơn
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {approveModalOpen && currentWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Duyệt Yêu Cầu Rút Tiền</h3>
            <p className="text-sm text-gray-500 mb-4">Vui lòng chuyển khoản <b>{formatCurrency(currentWithdrawal.amount)}</b> tới số tài khoản bên dưới và upload ảnh hóa đơn.</p>

            <div className="bg-gray-50 p-4 rounded-xl mb-4 text-sm">
              <p>Ngân hàng: <b>{currentWithdrawal.bankName}</b></p>
              <p>Số tài khoản: <b>{currentWithdrawal.bankAccountNumber}</b></p>
              <p>Chủ tài khoản: <b>{currentWithdrawal.bankAccountHolder}</b></p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh Bill Chuyển Khoản (*)</label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50"
              >
                {proofFile ? (
                  <p className="text-sm font-medium text-blue-600">{proofFile.name}</p>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">Click để chọn ảnh</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={processing}>Hủy</Button>
              <Button onClick={handleConfirmApprove} disabled={processing || !proofFile}>
                {processing ? 'Đang xử lý...' : 'Xác nhận duyệt'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {rejectModalOpen && currentWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Từ chối Yêu Cầu Rút Tiền</h3>
            <p className="text-sm text-gray-500 mb-4">Bạn đang từ chối yêu cầu rút <b>{formatCurrency(currentWithdrawal.amount)}</b> của <b>{currentWithdrawal.ownerType}</b>.</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do từ chối (*)</label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Thông tin tài khoản không hợp lệ..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>Hủy</Button>
              <Button variant="danger" onClick={handleConfirmReject} disabled={processing || !rejectReason.trim()}>
                {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
