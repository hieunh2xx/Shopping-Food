import { useEffect, useState } from 'react';
import { Banknote, CheckCircle, XCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Card, Button, Input, Loading, Modal } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import { ENV } from '../../config/env';
import toast from 'react-hot-toast';

type RemittanceStatus = '' | 'Pending' | 'Approved' | 'Rejected';

/**
 * Trang Phê Duyệt Nộp Tiền Thu Hộ COD Của Tài Xế (CodRemittancesPage).
 * Đối soát các khoản tiền COD do tài xế nộp lại qua chuyển khoản ngân hàng:
 * - Xem hình ảnh bill thanh toán chuyển khoản do shipper tải lên
 * - Phê duyệt ghi nhận hoàn tất nộp tiền COD hoặc từ chối có nêu lý do.
 */
export function CodRemittancesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RemittanceStatus>('Pending');
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);


  const loadData = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getCodRemittances(status || undefined);
      if (!res.error && res.data) {
        setItems(res.data.items || []);
        setPendingCount(res.data.pendingCount || 0);
      } else {
        toast.error(res.message || 'Không tải được danh sách');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [status]);

  const handleApprove = async (item: any) => {
    setProcessing(true);
    try {
      const res = await paymentService.reviewCodRemittance({ remittanceId: item.id, approve: true });
      if (!res.error) {
        toast.success(res.message || 'Đã duyệt nộp COD');
        loadData();
      } else toast.error(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi duyệt');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.item) return;
    if (!rejectReason.trim()) return toast.error('Vui lòng nhập lý do từ chối');
    setProcessing(true);
    try {
      const res = await paymentService.reviewCodRemittance({
        remittanceId: rejectModal.item.id,
        approve: false,
        rejectReason: rejectReason.trim(),
      });
      if (!res.error) {
        toast.success(res.message || 'Đã từ chối');
        setRejectModal({ open: false, item: null });
        setRejectReason('');
        loadData();
      } else toast.error(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi từ chối');
    } finally {
      setProcessing(false);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'Pending') return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-800">Chờ duyệt</span>;
    if (s === 'Approved') return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-green-100 text-green-800">Đã duyệt</span>;
    if (s === 'Rejected') return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-red-100 text-red-800">Từ chối</span>;
    return <span className="text-xs text-gray-500">{s}</span>;
  };

  const resolveImage = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${ENV.API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-7 h-7 text-amber-500" />
            Duyệt nộp COD tài xế
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xác nhận khi tài xế đã nộp tiền thu hộ về nền tảng — chỉ trừ công nợ COD sau khi duyệt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl font-semibold">
            Chờ duyệt: {pendingCount}
          </span>
          <Button variant="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { value: 'Pending' as const, label: 'Chờ duyệt' },
          { value: 'Approved' as const, label: 'Đã duyệt' },
          { value: 'Rejected' as const, label: 'Từ chối' },
          { value: '' as const, label: 'Tất cả' },
        ]).map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setStatus(f.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
              status === f.value
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="p-0 overflow-hidden border border-gray-100">
        {loading ? (
          <div className="py-16"><Loading /></div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">Không có yêu cầu nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Tài xế</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Ghi chú / Ảnh</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.shipperName}</p>
                      <p className="text-xs text-gray-500">{item.phone || '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">COD còn: {formatCurrency(item.currentCodDebt || 0)}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-700">{formatCurrency(item.amount)}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{item.note || '—'}</p>
                      {item.proofImageUrl && (
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                          onClick={() => setProofUrl(resolveImage(item.proofImageUrl))}
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Xem ảnh chứng từ
                        </button>
                      )}
                      {item.status === 'Rejected' && item.rejectReason && (
                        <p className="text-xs text-red-600 mt-1">Lý do: {item.rejectReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                      {item.reviewedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Duyệt: {new Date(item.reviewedAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'Pending' ? (
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={processing}
                            onClick={() => handleApprove(item)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={processing}
                            onClick={() => {
                              setRejectReason('');
                              setRejectModal({ open: true, item });
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Từ chối
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => !processing && setRejectModal({ open: false, item: null })}
        title="Từ chối yêu cầu nộp COD"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Từ chối yêu cầu {formatCurrency(rejectModal.item?.amount || 0)} của{' '}
            <strong>{rejectModal.item?.shipperName}</strong>. Công nợ COD của tài xế không bị trừ.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do <span className="text-red-500">*</span></label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Chưa nhận được chuyển khoản, sai số tiền..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" disabled={processing} onClick={() => setRejectModal({ open: false, item: null })}>
              Hủy
            </Button>
            <Button variant="danger" isLoading={processing} onClick={handleReject}>
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!proofUrl} onClose={() => setProofUrl(null)} title="Ảnh chứng từ nộp COD" size="lg">
        {proofUrl && (
          <div className="flex justify-center bg-gray-950 p-2 rounded-2xl max-h-[80vh] overflow-hidden">
            <img src={proofUrl} alt="Proof" className="max-h-[75vh] object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
