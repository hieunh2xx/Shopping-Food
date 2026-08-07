import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, FileImage, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Card, Button, Input } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

type WithdrawalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Disputed';

export function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

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
      const res = await paymentService.getWithdrawals(selectedStatus || undefined);
      if (!res.error) setWithdrawals(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedStatus]);

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
      // 1. Upload ảnh
      const uploadRes = await paymentService.uploadWithdrawalProof(proofFile);
      if (uploadRes.error) {
        toast.error(uploadRes.message || 'Lỗi upload ảnh');
        return;
      }
      
      const imageUrl = uploadRes.data?.imageUrl;

      // 2. Approve
      const res = await paymentService.approveWithdrawal({
        withdrawalId: currentWithdrawal.id,
        approve: true,
        transferProofImageUrl: imageUrl
      });

      if (!res.error) {
        toast.success(res.message || 'Duyệt thành công');
        setApproveModalOpen(false);
        loadData();
      } else {
        toast.error(res.message);
      }
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
        toast.success(res.message || 'Từ chối thành công');
        setRejectModalOpen(false);
        loadData();
      } else {
        toast.error(res.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleForceComplete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn đã chuyển khoản và muốn chốt đơn này?')) return;
    
    const res = await paymentService.forceCompleteWithdrawal({ withdrawalId: id });
    if (!res.error) {
      toast.success(res.message || 'Hoàn thành ép buộc thành công');
      loadData();
    } else {
      toast.error(res.message);
    }
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case 'Pending': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'Approved': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Đã chuyển tiền - Chờ XN</span>;
      case 'Rejected': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Từ chối</span>;
      case 'Completed': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoàn thành</span>;
      case 'Disputed': return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 font-bold border border-red-300">Đang khiếu nại</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yêu cầu rút tiền</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và duyệt các yêu cầu rút tiền từ Seller / Shipper</p>
        </div>
        
        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Chờ duyệt (Pending)</option>
          <option value="Approved">Đã chuyển (Approved)</option>
          <option value="Completed">Hoàn thành (Completed)</option>
          <option value="Disputed">Khiếu nại (Disputed)</option>
          <option value="Rejected">Từ chối (Rejected)</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Mã / Ngày tạo</th>
                  <th className="px-6 py-4">Đối tượng</th>
                  <th className="px-6 py-4">Số tiền rút</th>
                  <th className="px-6 py-4">Thông tin ngân hàng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">#{w.id.substring(0, 8)}</p>
                      <p className="text-xs text-gray-500">{formatDate(w.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-lg font-medium ${w.ownerType === 'Shipper' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                        {w.ownerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.bankName}</p>
                      <p className="text-xs text-gray-500">{w.bankAccountNumber} - {w.bankAccountHolder}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(w.status)}
                        {w.transferProofImageUrl && (
                          <a href={w.transferProofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mt-1">
                            <FileImage className="w-3 h-3 mr-1" /> Xem Bill
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {w.status === 'Pending' && (
                        <>
                          <Button size="sm" onClick={() => handleOpenApprove(w)}>Duyệt</Button>
                          <Button size="sm" variant="outline" onClick={() => handleOpenReject(w)}>Từ chối</Button>
                        </>
                      )}
                      {w.status === 'Disputed' && (
                        <Button size="sm" onClick={() => handleForceComplete(w.id)}>Force Complete</Button>
                      )}
                      {w.status === 'Approved' && (
                        <Button size="sm" variant="ghost" onClick={() => handleForceComplete(w.id)} title="Ép buộc hoàn thành nếu user không chịu confirm">Force Complete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setApproveModalOpen(false)} disabled={processing}>Hủy</Button>
              <Button onClick={handleConfirmApprove} isLoading={processing} disabled={!proofFile}>Xác nhận đã chuyển khoản</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối */}
      {rejectModalOpen && currentWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Từ chối Yêu Cầu Rút Tiền</h3>
            <p className="text-sm text-gray-500 mb-4">Tiền sẽ được hoàn lại vào ví của người dùng.</p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do từ chối (*)</label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={processing}>Hủy</Button>
              <Button onClick={handleConfirmReject} isLoading={processing}>Xác nhận Từ chối</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
