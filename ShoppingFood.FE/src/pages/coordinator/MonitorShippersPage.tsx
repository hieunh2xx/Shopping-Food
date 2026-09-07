import { useState, useEffect } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertOctagon, UserMinus, ShieldCheck, Ban } from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import { coordinatorService } from '../../services';
import { adminService } from '../../services/AdminService';
import { useAuth, useConfirm } from '../../hooks';
import toast from 'react-hot-toast';
import { AdjustReputationModal } from './components/AdjustReputationModal';

/**
 * Trang Giám Sát Hoạt Động Tài Xế Dành Cho Điều Phối Viên (MonitorShippersPage).
 * Giám sát trạng thái hoạt động và can thiệp vận hành:
 * - Theo dõi danh sách tài xế Đang trực tuyến (Online) / Ngoại tuyến (Offline)
 * - Tạm khóa hoạt động tài xế theo số phút có nêu rõ lý do
 * - Điều chỉnh điểm uy tín (Cộng/Trừ sao uy tín)
 * - Khóa/mở khóa tài khoản tài xế.
 */
export default function MonitorShippersPage() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const [shippers, setShippers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnlineFilter, setIsOnlineFilter] = useState<'all' | 'online' | 'offline'>('all');


  // Suspend Modal
  const [selectedShipper, setSelectedShipper] = useState<any | null>(null);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('60'); // Minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reputation Modal
  const [isReputationOpen, setIsReputationOpen] = useState(false);
  const [selectedShipperForReputation, setSelectedShipperForReputation] = useState<any | null>(null);

  useEffect(() => {
    fetchShippers();
  }, [isOnlineFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShippers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchShippers = async () => {
    setIsLoading(true);
    try {
      const isOnline = isOnlineFilter === 'all' ? undefined : (isOnlineFilter === 'online');
      const res = await coordinatorService.getMonitorShippers(isOnline, searchTerm || undefined);
      if (!res.error && res.data) {
        setShippers(res.data);
      }
    } catch {
      toast.error('Tải danh sách giám sát tài xế thất bại do lỗi kết nối mạng.');
    } finally {
      setIsLoading(true); // Wait, setting it to true at the end? Ah, no, it should be false!
      setIsLoading(false);
    }
  };

  const handleOpenSuspendModal = (shipper: any) => {
    setSelectedShipper(shipper);
    setSuspendReason('');
    setSuspendDuration('60');
    setIsSuspendOpen(true);
  };

  const handleOpenReputationModal = (shipper: any) => {
    setSelectedShipperForReputation(shipper);
    setIsReputationOpen(true);
  };

  const handleSuspendShipper = async () => {
    if (!selectedShipper || !suspendReason) {
      toast.error('Vui lòng nhập lý do khóa shipper');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await coordinatorService.suspendShipper(selectedShipper.shipperId, {
        durationMinutes: Number(suspendDuration),
        reason: suspendReason
      });

      if (!res.error) {
        toast.success(`Đã tạm khóa hoạt động tài xế ${selectedShipper.fullName} trong ${suspendDuration} phút!`);
        setIsSuspendOpen(false);
        fetchShippers();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tạm khóa tài xế thất bại do lỗi kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAdminLock = async (shipper: any, isLocked: boolean) => {
    const confirmed = await confirm({
      title: isLocked ? 'Khóa tài xế' : 'Mở khóa tài xế',
      message: isLocked
        ? `Bạn có chắc chắn muốn khóa tài khoản tài xế ${shipper.fullName} vô thời hạn?`
        : `Bạn có chắc chắn muốn mở khóa cho tài xế ${shipper.fullName}?`,
      confirmText: isLocked ? 'Khóa' : 'Mở khóa',
      isDanger: isLocked,
    });
    if (!confirmed) return;
    
    setIsSubmitting(true);
    try {
      const res = await adminService.toggleShipperStatus(shipper.shipperId, isLocked);
      if (!res.error) {
        toast.success(isLocked ? `Đã khóa tài khoản tài xế ${shipper.fullName}` : `Đã mở khóa tài khoản tài xế ${shipper.fullName}`);
        fetchShippers();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Cập nhật trạng thái thất bại do lỗi kết nối mạng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVehicleName = (type: string) => {
    switch (type) {
      case 'Motorcycle':
        return 'Xe máy';
      case 'ElectricMotorbike':
        return 'Xe điện';
      case 'Car':
        return 'Ô tô';
      default:
        return type;
    }
  };

  return (
    <div className="p-6">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
          Giám Sát Tài Xế (Shipper Monitoring)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi trạng thái hoạt động trực tuyến, thống kê đơn hàng và đình chỉ hoạt động tài xế vi phạm
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tên, SĐT shipper..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="flex gap-2">
          <select 
            value={isOnlineFilter}
            onChange={(e: any) => setIsOnlineFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="all">Tất cả trạng thái hoạt động</option>
            <option value="online">Đang trực tuyến (Online)</option>
            <option value="offline">Ngoại tuyến (Offline)</option>
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
                  <th className="py-4 px-6 font-medium">Tài xế</th>
                  <th className="py-4 px-6 font-medium">Số điện thoại</th>
                  <th className="py-4 px-6 font-medium">Phương tiện</th>
                  <th className="py-4 px-6 font-medium text-center">Hoạt động</th>
                  <th className="py-4 px-6 font-medium text-center">Đang giao đơn</th>
                  <th className="py-4 px-6 font-medium text-center">Đã hoàn thành</th>
                  <th className="py-4 px-6 font-medium text-center">Uy tín</th>
                  <th className="py-4 px-6 font-medium text-center">Tài khoản</th>
                  <th className="py-4 px-6 font-medium text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippers.map((shipper) => (
                  <tr key={shipper.shipperId} className="hover:bg-orange-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900 text-sm">
                      {shipper.fullName}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{shipper.phone}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {getVehicleName(shipper.vehicleType)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        shipper.isOnline ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${shipper.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {shipper.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-sm font-medium ${shipper.isBusy ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                        {shipper.isBusy ? 'Đang giao' : 'Rảnh'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-medium text-gray-700">
                      {shipper.completedOrderCount}
                    </td>
                    <td className="py-4 px-6 text-center text-sm font-bold text-orange-600">
                      {shipper.reputationScore} ⭐
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        shipper.isLocked ? 'bg-red-50 text-red-700 border border-red-200' :
                        shipper.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' : 
                        shipper.status === 'Blocked' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {!shipper.isLocked && shipper.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                        {shipper.isLocked ? 'Bị khóa (Admin)' : shipper.status === 'Active' ? 'Hoạt động' : shipper.status === 'Blocked' ? 'Khóa' : shipper.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!shipper.isLocked && shipper.status === 'Active' ? (
                          <>
                            {user?.role === 'Admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAdminLock(shipper, true)}
                                className="text-red-600 hover:bg-red-50 border-red-200 flex items-center gap-1"
                                disabled={isSubmitting}
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Khóa
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSuspendModal(shipper)}
                              className="text-red-600 hover:bg-red-50 border-red-200 flex items-center gap-1"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Tạm khóa
                            </Button>
                          </>
                        ) : (
                          user?.role === 'Admin' && shipper.isLocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleAdminLock(shipper, false)}
                              className="text-green-600 hover:bg-green-50 border-green-200 flex items-center gap-1"
                              disabled={isSubmitting}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Mở khóa
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReputationModal(shipper)}
                          className="text-orange-600 hover:bg-orange-50 border-orange-200 flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Điểm
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {shippers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      Không tìm thấy tài xế nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Suspend Modal */}
      <Modal
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        title={`Đình chỉ hoạt động tài xế: ${selectedShipper?.fullName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Tài xế bị đình chỉ tạm thời sẽ không thể nhận bất kỳ đề xuất giao hàng nào từ hệ thống hoặc Coordinator trong khoảng thời gian bị khóa.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Thời hạn tạm khóa (phút)</label>
            <select
              value={suspendDuration}
              onChange={(e) => setSuspendDuration(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
            >
              <option value="15">15 phút</option>
              <option value="30">30 phút</option>
              <option value="60">1 tiếng (60 phút)</option>
              <option value="180">3 tiếng (180 phút)</option>
              <option value="1440">1 ngày (24 tiếng)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lý do đình chỉ <span className="text-red-500">*</span></label>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="VD: Không giao hàng, thái độ không đúng mực, cố tình từ chối nhiều đơn..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsSuspendOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button 
              onClick={handleSuspendShipper} 
              isLoading={isSubmitting} 
              disabled={isSubmitting || !suspendReason}
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              Xác nhận tạm khóa
            </Button>
          </div>
        </div>
      </Modal>

      {isReputationOpen && selectedShipperForReputation && (
        <AdjustReputationModal
          shipper={selectedShipperForReputation}
          onClose={() => setIsReputationOpen(false)}
          onSuccess={fetchShippers}
        />
      )}
    </div>
  );
}
