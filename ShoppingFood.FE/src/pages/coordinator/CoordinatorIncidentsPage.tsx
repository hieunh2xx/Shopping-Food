import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Search, User, Truck, HelpCircle, FileText, FileWarning, Plus, Eye, Store, MessageSquareWarning } from 'lucide-react';
import { Button, Loading, Modal } from '../../components/common';
import { coordinatorService } from '../../services/CoordinatorService';
import { CreateTicketModal } from './components/CreateTicketModal';
import type { IIncidentItemDto } from '../../interfaces';
import toast from 'react-hot-toast';

interface ExplanationItem {
  id: string;
  orderId: string;
  requestMessage: string;
  status: string;
  shipperReply?: string | null;
  createdAt: string;
  repliedAt?: string | null;
  requestedByName?: string;
}

export function CoordinatorIncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkHandledRef = useRef(false);
  const [incidents, setIncidents] = useState<IIncidentItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState<IIncidentItemDto | null>(null);
  const [explanations, setExplanations] = useState<ExplanationItem[]>([]);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [explanationModal, setExplanationModal] = useState<{ isOpen: boolean; orderId: string; message: string }>({
    isOpen: false,
    orderId: '',
    message: '',
  });
  const [submittingExplanation, setSubmittingExplanation] = useState(false);

  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    incidentId: string;
    orderId: string;
    incidentType: string;
    resolutionType: 'CustomerFault' | 'ShipperFault' | 'ForceCancelNoPenalty' | 'CompensateCustomer' | 'Warning' | 'Dismiss' | 'EscalateToAdmin';
    notes: string;
    penaltyScore: number;
  }>({
    isOpen: false,
    incidentId: '',
    orderId: '',
    incidentType: '',
    resolutionType: 'Warning',
    notes: '',
    penaltyScore: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [incidentTypeFilter]);

  useEffect(() => {
    if (isLoading || deepLinkHandledRef.current || incidents.length === 0) return;
    const orderId = searchParams.get('orderId');
    if (!orderId) return;
    deepLinkHandledRef.current = true;
    const match = incidents.find(
      (i) =>
        i.orderId === orderId ||
        i.id === orderId ||
        (i.orderId && i.orderId.toLowerCase().startsWith(orderId.toLowerCase().slice(0, 8)))
    );
    if (match) {
      void openDetail(match);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('orderId');
      return next;
    }, { replace: true });
  }, [isLoading, incidents, searchParams, setSearchParams]);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await coordinatorService.getIncidents(incidentTypeFilter || undefined);
      if (!res.error && res.data) {
        setIncidents(res.data);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tải danh sách sự cố thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExplanations = async (orderId: string) => {
    setLoadingExplanations(true);
    try {
      const res = await coordinatorService.getOrderExplanation(orderId);
      if (!res.error && res.data) {
        setExplanations(res.data as ExplanationItem[]);
      } else {
        setExplanations([]);
      }
    } catch {
      setExplanations([]);
    } finally {
      setLoadingExplanations(false);
    }
  };

  const openDetail = async (incident: IIncidentItemDto) => {
    setDetailIncident(incident);
    setExplanations([]);
    const oid = incident.orderId || (incident.incidentType === 'DeliveryFailed' ? incident.id : null);
    if (oid) await loadExplanations(oid);
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'OrderComplaint': return <HelpCircle className="w-5 h-5 text-orange-500" />;
      case 'ShipperComplaint': return <User className="w-5 h-5 text-rose-500" />;
      case 'RestaurantComplaint': return <Store className="w-5 h-5 text-amber-500" />;
      case 'DeliveryFailed': return <Truck className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getIncidentLabel = (type: string) => {
    switch (type) {
      case 'OrderComplaint': return 'Khiếu nại Đơn Hàng';
      case 'ShipperComplaint': return 'Khiếu nại Tài Xế';
      case 'RestaurantComplaint': return 'Khiếu nại Nhà Hàng';
      case 'DeliveryFailed': return 'Sự cố giao hàng (Shipper)';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Chờ xử lý</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Đã xử lý</span>;
      case 'ignored':
      case 'dismissed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Đã bỏ qua</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  const formatRejectReason = (desc?: string | null) => {
    if (!desc) return 'Không có mô tả.';
    return desc.replace(/^\[Delivery Failed\]\s*/i, '');
  };

  const filteredIncidents = incidents.filter(i =>
    (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.contactName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openResolutionModal = (incident: IIncidentItemDto) => {
    setDetailIncident(null);
    setResolutionModal({
      isOpen: true,
      incidentId: incident.id,
      orderId: incident.orderId || incident.id,
      incidentType: incident.incidentType,
      resolutionType: incident.incidentType === 'DeliveryFailed' ? 'ForceCancelNoPenalty' : 'Warning',
      notes: '',
      penaltyScore: 0
    });
  };

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModal.notes.trim()) {
      toast.error('Vui lòng nhập ghi chú xử lý');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        resolutionType: resolutionModal.resolutionType,
        notes: resolutionModal.notes,
        penaltyScore: resolutionModal.penaltyScore > 0 ? resolutionModal.penaltyScore : undefined
      };

      const res = resolutionModal.incidentType === 'DeliveryFailed'
        ? await coordinatorService.resolveIncident(resolutionModal.orderId, {
            resolutionType: resolutionModal.resolutionType,
            notes: resolutionModal.notes,
            penaltyScore: resolutionModal.penaltyScore || 0,
          })
        : await coordinatorService.resolveComplaint(resolutionModal.incidentId, payload);

      if (!res.error) {
        toast.success('Đã xử lý sự cố thành công');
        setResolutionModal(prev => ({ ...prev, isOpen: false }));
        fetchIncidents();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message;
      toast.error(rawMessage || 'Xử lý sự cố thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Loading text="Đang tải dữ liệu sự cố..." />;

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
            Xử lý Sự cố & Khiếu nại
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Giám sát báo cáo sự cố từ shipper và khiếu nại từ khách hàng / nhà hàng.
          </p>
        </div>
        <Button
          className="flex items-center gap-2 whitespace-nowrap"
          onClick={() => setIsCreateTicketModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Tạo phiếu hỗ trợ thủ công
        </Button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="text"
            placeholder="Tìm theo Mã đơn / Tên / Nội dung..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select
            value={incidentTypeFilter}
            onChange={(e) => setIncidentTypeFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="">Tất cả loại sự cố</option>
            <option value="DeliveryFailed">Sự cố giao hàng (Shipper)</option>
            <option value="OrderComplaint">Khiếu nại Đơn hàng</option>
            <option value="ShipperComplaint">Khiếu nại Tài xế</option>
            <option value="RestaurantComplaint">Khiếu nại Nhà hàng</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Loại sự cố</th>
                <th className="py-4 px-6 font-medium">Tiêu đề</th>
                <th className="py-4 px-6 font-medium">Người báo cáo</th>
                <th className="py-4 px-6 font-medium">Mã đơn hàng</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium">Thời gian</th>
                <th className="py-4 px-6 font-medium text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredIncidents.map(incident => (
                <tr key={`${incident.incidentType}-${incident.id}`} className="hover:bg-orange-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {getIncidentIcon(incident.incidentType)}
                      <span className="text-xs font-semibold text-gray-600">{getIncidentLabel(incident.incidentType)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 text-sm truncate">{incident.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{formatRejectReason(incident.description)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-800">
                    <div>
                      <p className="font-medium">{incident.contactName || '—'}</p>
                      {incident.contactPhone && <p className="text-xs text-gray-500">{incident.contactPhone}</p>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-xs font-semibold text-gray-700">
                      {incident.orderId ? '#' + incident.orderId.substring(0, 8).toUpperCase() : 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(incident.createdAt).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit',
                      day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => void openDetail(incident)}>
                        <Eye className="w-4 h-4 mr-1" /> Xem
                      </Button>
                      {incident.status.toLowerCase() === 'pending' && (
                        <Button size="sm" onClick={() => openResolutionModal(incident)}>
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Giải quyết
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <FileWarning className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    Không có sự cố nào cần xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailIncident}
        onClose={() => {
          setDetailIncident(null);
          setExplanations([]);
        }}
        title="Chi tiết sự cố"
      >
        {detailIncident && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {getIncidentIcon(detailIncident.incidentType)}
              <span className="text-sm font-semibold text-gray-700">{getIncidentLabel(detailIncident.incidentType)}</span>
              {getStatusBadge(detailIncident.status)}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Tiêu đề</p>
              <p className="font-semibold text-gray-900">{detailIncident.title}</p>
            </div>

            <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-4">
              <p className="text-xs text-orange-600 font-semibold mb-1 uppercase tracking-wide">Nội dung báo cáo</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {formatRejectReason(detailIncident.description)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Người báo cáo</p>
                <p className="font-medium text-gray-900">{detailIncident.contactName || '—'}</p>
                {detailIncident.contactPhone && (
                  <p className="text-xs text-gray-500 mt-0.5">{detailIncident.contactPhone}</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">Mã đơn hàng</p>
                <p className="font-mono font-semibold text-gray-900">
                  {detailIncident.orderId
                    ? `#${detailIncident.orderId.substring(0, 8).toUpperCase()}`
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Thời gian</p>
                <p className="font-medium text-gray-900">
                  {new Date(detailIncident.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>

            {detailIncident.incidentType === 'DeliveryFailed' && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                    Giải trình tài xế
                  </p>
                  {!(explanations.some((e) => e.status === 'Pending')) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setExplanationModal({
                          isOpen: true,
                          orderId: detailIncident.orderId || detailIncident.id,
                          message: '',
                        })
                      }
                    >
                      Yêu cầu giải trình
                    </Button>
                  )}
                </div>
                {loadingExplanations ? (
                  <p className="text-xs text-gray-500">Đang tải...</p>
                ) : explanations.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có yêu cầu giải trình.</p>
                ) : (
                  <div className="space-y-2">
                    {explanations.map((ex) => (
                      <div key={ex.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {new Date(ex.createdAt).toLocaleString('vi-VN')}
                            {ex.requestedByName ? ` · ${ex.requestedByName}` : ''}
                          </span>
                          <span className={`text-xs font-medium ${ex.status === 'Replied' ? 'text-green-700' : 'text-amber-700'}`}>
                            {ex.status === 'Replied' ? 'Đã trả lời' : 'Chờ trả lời'}
                          </span>
                        </div>
                        <p className="text-gray-800"><span className="text-gray-500">Yêu cầu:</span> {ex.requestMessage}</p>
                        {ex.shipperReply && (
                          <p className="mt-1 text-gray-800 whitespace-pre-wrap">
                            <span className="text-gray-500">Shipper:</span> {ex.shipperReply}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  setDetailIncident(null);
                  setExplanations([]);
                }}
              >
                Đóng
              </Button>
              {detailIncident.status.toLowerCase() === 'pending' && (
                <Button onClick={() => openResolutionModal(detailIncident)}>
                  <CheckCircle className="w-4 h-4 mr-1.5" /> Giải quyết
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={explanationModal.isOpen}
        onClose={() => setExplanationModal((p) => ({ ...p, isOpen: false }))}
        title="Yêu cầu giải trình từ tài xế"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Tài xế sẽ nhận thông báo và gửi lại giải trình cho đơn này.
          </p>
          <textarea
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500"
            rows={4}
            placeholder="Nội dung yêu cầu (ví dụ: vui lòng làm rõ tình huống khi giao...)"
            value={explanationModal.message}
            onChange={(e) => setExplanationModal((p) => ({ ...p, message: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setExplanationModal((p) => ({ ...p, isOpen: false }))}
              disabled={submittingExplanation}
            >
              Hủy
            </Button>
            <Button
              isLoading={submittingExplanation}
              disabled={submittingExplanation || !explanationModal.message.trim()}
              onClick={async () => {
                if (!explanationModal.message.trim()) {
                  toast.error('Vui lòng nhập nội dung yêu cầu');
                  return;
                }
                setSubmittingExplanation(true);
                try {
                  const res = await coordinatorService.requestExplanation(
                    explanationModal.orderId,
                    explanationModal.message.trim()
                  );
                  if (!res.error) {
                    toast.success('Đã gửi yêu cầu giải trình tới tài xế');
                    setExplanationModal({ isOpen: false, orderId: '', message: '' });
                    await loadExplanations(explanationModal.orderId);
                  } else {
                    toast.error(res.message);
                  }
                } catch {
                  toast.error('Không gửi được yêu cầu giải trình');
                } finally {
                  setSubmittingExplanation(false);
                }
              }}
            >
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={resolutionModal.isOpen} onClose={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))} title="Quyết định xử lý">
        <form onSubmit={handleResolveIncident} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hướng xử lý</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500"
              value={resolutionModal.resolutionType}
              onChange={e => setResolutionModal({ ...resolutionModal, resolutionType: e.target.value as any })}
            >
              {resolutionModal.incidentType === 'DeliveryFailed' ? (
                <>
                  <option value="ForceCancelNoPenalty">Hủy đơn không phạt (Sự cố khách quan)</option>
                  <option value="CustomerFault">Lỗi khách hàng</option>
                  <option value="ShipperFault">Lỗi tài xế (Phạt điểm)</option>
                </>
              ) : (
                <>
                  <option value="Warning">Cảnh cáo (Gửi thông báo vi phạm)</option>
                  <option value="ShipperFault">Lỗi tài xế (Phạt điểm)</option>
                  <option value="CustomerFault">Lỗi khách hàng</option>
                  <option value="EscalateToAdmin">Chuyển cho Admin xử lý đền bù</option>
                  <option value="ForceCancelNoPenalty">Hủy đơn không phạt (Sự cố khách quan)</option>
                  <option value="Dismiss">Bỏ qua (Khiếu nại không hợp lệ)</option>
                </>
              )}
            </select>
          </div>

          {resolutionModal.resolutionType === 'ShipperFault' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm phạt trừ tài xế (Tùy chọn)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500"
                value={resolutionModal.penaltyScore}
                onChange={e => setResolutionModal({ ...resolutionModal, penaltyScore: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Chi tiết quyết định)</label>
            <textarea
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              placeholder="Ghi rõ lý do và cách xử lý..."
              value={resolutionModal.notes}
              onChange={e => setResolutionModal({ ...resolutionModal, notes: e.target.value })}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))} disabled={isSubmitting}>Hủy</Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>Xác nhận xử lý</Button>
          </div>
        </form>
      </Modal>

      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        onSuccess={fetchIncidents}
      />
    </div>
  );
}
