import { useEffect, useState, useRef } from 'react';
import { useConfirm } from '../../hooks';
import { DollarSign, TrendingUp, CheckCircle, XCircle, BarChart3, AlertCircle } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { Image as ImageIcon } from 'lucide-react';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export function AdminFinancePage() {
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [disputedWithdrawals, setDisputedWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentWithdrawal, setCurrentWithdrawal] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, wdRes, dispRes] = await Promise.all([
        paymentService.getReconciliation(),
        paymentService.getWithdrawals('Pending'),
        paymentService.getWithdrawals('Disputed'),
      ]);
      if (!recRes.error) setReconciliation(recRes.data);
      if (!wdRes.error) setWithdrawals(wdRes.data || []);
      if (!dispRes.error) setDisputedWithdrawals(dispRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

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

      {/* Khiếu nại */}
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

      {/* Modal Duyệt */}
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

      {/* Modal Từ chối */}
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
