import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Search, User, Truck, HelpCircle, FileText, AlertTriangle, XCircle, FileWarning, Plus } from 'lucide-react';
import { Button, Loading, Modal, Pagination } from '../../components/common';
import { coordinatorService } from '../../services/CoordinatorService';
import { CreateTicketModal } from './components/CreateTicketModal';
import type { IIncidentItemDto } from '../../interfaces';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';

export function CoordinatorIncidentsPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<IIncidentItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>(''); // empty for all
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  // Resolution Modal
  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    incidentId: string;
    incidentType: string;
    resolutionType: 'CustomerFault' | 'ShipperFault' | 'ForceCancelNoPenalty' | 'CompensateCustomer' | 'Warning' | 'Dismiss';
    notes: string;
    penaltyScore: number;
  }>({
    isOpen: false,
    incidentId: '',
    incidentType: '',
    resolutionType: 'Warning',
    notes: '',
    penaltyScore: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, [incidentTypeFilter]);

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const res = await coordinatorService.getIncidents(incidentTypeFilter || undefined);
      if (!res.error && res.data) {
        setIncidents(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách sự cố');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải danh sách sự cố');
    } finally {
      setIsLoading(false);
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'OrderComplaint': return <HelpCircle className="w-5 h-5 text-orange-500" />;
      case 'ShipperComplaint': return <User className="w-5 h-5 text-rose-500" />;
      case 'DeliveryFailed': return <Truck className="w-5 h-5 text-gray-500" />;
      default: return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getIncidentLabel = (type: string) => {
    switch (type) {
      case 'OrderComplaint': return 'Khiếu nại Đơn Hàng';
      case 'ShipperComplaint': return 'Khiếu nại Tài Xế';
      case 'DeliveryFailed': return 'Lỗi Giao Hàng';
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
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Đã bỏ qua</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  const filteredIncidents = incidents.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.orderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openResolutionModal = (incident: IIncidentItemDto) => {
    setResolutionModal({
      isOpen: true,
      incidentId: incident.id,
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
      const res = await coordinatorService.resolveComplaint(resolutionModal.incidentId, {
        resolutionType: resolutionModal.resolutionType,
        notes: resolutionModal.notes,
        penaltyScore: resolutionModal.penaltyScore > 0 ? resolutionModal.penaltyScore : undefined
      });

      if (!res.error) {
        toast.success('Đã xử lý sự cố thành công');
        setResolutionModal(prev => ({ ...prev, isOpen: false }));
        fetchIncidents();
      } else {
        toast.error(res.message || 'Lỗi xử lý sự cố');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xử lý sự cố');
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
            Giám sát và giải quyết các khiếu nại từ khách hàng hoặc sự cố giao hàng.
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

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <input
            type="text"
            placeholder="Tìm theo Mã đơn / Tên..."
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
            <option value="OrderComplaint">Khiếu nại Đơn hàng</option>
            <option value="ShipperComplaint">Khiếu nại Tài xế</option>
            <option value="DeliveryFailed">Lỗi giao hàng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
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
                  <tr key={incident.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getIncidentIcon(incident.incidentType)}
                        <span className="text-xs font-semibold text-gray-600">{getIncidentLabel(incident.incidentType)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900 text-sm truncate">{incident.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{incident.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-800">
                      <div>
                        <p className="font-medium">{incident.contactName || 'Khách vãng lai'}</p>
                        {incident.contactPhone && <p className="text-xs text-gray-500">{incident.contactPhone}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-gray-700">{incident.orderId.substring(0, 8)}...</span>
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
                      {incident.status.toLowerCase() === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => openResolutionModal(incident)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Giải quyết
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
          )}
        </div>
      </div>

      <Modal isOpen={resolutionModal.isOpen} onClose={() => setResolutionModal(prev => ({ ...prev, isOpen: false }))} title="Quyết định xử lý">
        <form onSubmit={handleResolveIncident} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hướng xử lý</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-orange-500 focus:border-orange-500"
              value={resolutionModal.resolutionType}
              onChange={e => setResolutionModal({ ...resolutionModal, resolutionType: e.target.value as any })}
            >
              <option value="Warning">Cảnh cáo (Gửi thông báo vi phạm)</option>
              <option value="ShipperFault">Lỗi tài xế (Phạt điểm)</option>
              <option value="CustomerFault">Lỗi khách hàng (Khách hủy đơn)</option>
              <option value="CompensateCustomer">Đền bù khách hàng (Voucher/Hoàn tiền)</option>
              <option value="ForceCancelNoPenalty">Hủy đơn không phạt (Sự cố khách quan)</option>
              <option value="Dismiss">Bỏ qua (Khiếu nại không hợp lệ)</option>
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
