import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, AlertTriangle, CheckCircle, XCircle, ArrowRight, DollarSign } from 'lucide-react';
import { coordinatorService } from '../../services/CoordinatorService';
import { toast } from 'react-hot-toast';

export const AdminOrderComplaintsPage = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  // Form states
  const [resolutionType, setResolutionType] = useState('Dismiss');
  const [responsibleParty, setResponsibleParty] = useState('Restaurant');
  const [refundAmount, setRefundAmount] = useState<number | ''>(0);
  const [deductionAmount, setDeductionAmount] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const res = await coordinatorService.getOrderComplaints(filter);
      if (!res.error) {
        setComplaints(res.data);
      } else {
        toast.error(res.message || 'Lỗi khi tải danh sách khiếu nại');
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || 'Lỗi kết nối đến máy chủ, vui lòng thử lại sau.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (complaint: any) => {
    setSelectedComplaint(complaint);
    setResolutionType('Dismiss');
    setResponsibleParty('Restaurant');
    setRefundAmount(complaint.orderTotalAmount || 0);
    setDeductionAmount(complaint.orderTotalAmount || 0);
    setNotes('');
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      const payload = {
        resolutionType,
        notes,
        refundAmount: resolutionType === 'CompensateCustomer' ? (Number(refundAmount) || 0) : 0,
        deductionAmount: ['CompensateCustomer', 'SellerFault', 'ShipperFault'].includes(resolutionType) ? (Number(deductionAmount) || 0) : 0,
        responsibleParty: resolutionType === 'CompensateCustomer' ? responsibleParty : null,
        penaltyScore: 10
      };

      const res = await coordinatorService.resolveComplaint(selectedComplaint.reportId, payload);
      if (!res.error) {
        toast.success('Đã xử lý khiếu nại thành công');
        setSelectedComplaint(null);
        fetchComplaints();
      } else {
        toast.error(res.message || 'Xử lý khiếu nại thất bại');
      }
    } catch (error: any) {
      console.error(error);
      const rawMessage = error?.response?.data?.message || 'Lỗi kết nối đến máy chủ, không thể xử lý khiếu nại.';
      toast.error(rawMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Chờ xử lý</span>;
      case 'Escalated': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Chuyển Admin</span>;
      case 'Resolved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Đã giải quyết</span>;
      case 'Dismissed': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Đã hủy</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            Khiếu Nại Đơn Hàng
          </h1>
          <p className="text-gray-500 mt-1">Xử lý các vấn đề đền bù, hoàn tiền và phạt liên quan đến đơn hàng</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <select
          className="border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý</option>
          <option value="Escalated">Chuyển Admin</option>
          <option value="Resolved">Đã giải quyết</option>
          <option value="Dismissed">Đã bỏ qua</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium">Người khiếu nại</th>
                <th className="p-4 font-medium">Thông tin đơn</th>
                <th className="p-4 font-medium">Lý do</th>
                <th className="p-4 font-medium">Ngày tạo</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Không có dữ liệu khiếu nại.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.reportId} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{c.reporterName}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-900 font-medium truncate max-w-[200px]">{c.restaurantName}</p>
                      <p className="text-gray-500 text-xs mt-0.5">Mã đơn: {c.orderId.substring(0, 8)}</p>
                      <p className="text-gray-500 text-xs">Giá trị: {c.orderTotalAmount.toLocaleString('vi-VN')}đ</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-900 font-medium truncate max-w-[200px]">{c.title}</p>
                      <p className="text-gray-500 text-xs truncate max-w-[200px]">{c.content}</p>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(c.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        {c.status === 'Pending' || c.status === 'Escalated' ? 'Xem & Xử lý' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xử lý */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                Xử lý Khiếu Nại Đơn Hàng
              </h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Lý do: <span className="font-normal">{selectedComplaint.title}</span>
                </h3>
                {(() => {
                  const contentRaw = selectedComplaint.content || '';
                  const marker = 'Bằng chứng: ';
                  const idx = contentRaw.indexOf(marker);
                  let desc = contentRaw;
                  let img = '';
                  if (idx !== -1) {
                    desc = contentRaw.substring(0, idx).trim();
                    let afterMarker = contentRaw.substring(idx + marker.length).trim();
                    // Handle case where system appends resolution note after the image
                    const noteIdxVi = afterMarker.indexOf('\n[Đã xử lý bởi');
                    const noteIdxEn = afterMarker.indexOf('\n[Resolved');
                    const noteIdxAdmin = afterMarker.indexOf('\n[Đã chuyển cho Admin');
                    
                    if (noteIdxVi !== -1) {
                      img = afterMarker.substring(0, noteIdxVi).trim();
                      desc += '\n\n' + afterMarker.substring(noteIdxVi).trim();
                    } else if (noteIdxEn !== -1) {
                      img = afterMarker.substring(0, noteIdxEn).trim();
                      desc += '\n\n' + afterMarker.substring(noteIdxEn).trim();
                    } else if (noteIdxAdmin !== -1) {
                      img = afterMarker.substring(0, noteIdxAdmin).trim();
                      desc += '\n\n' + afterMarker.substring(noteIdxAdmin).trim();
                    } else {
                      img = afterMarker;
                    }
                  }
                  
                  // Helper function for image error handling
                  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                    }
                  };
                  
                  return (
                    <>
                      {desc && (
                        <p className="text-blue-800 text-sm whitespace-pre-wrap break-words">
                          <span className="font-semibold">Mô tả chi tiết:</span> <br/>
                          {desc}
                        </p>
                      )}
                      {img && img.startsWith('http') && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Bằng chứng:</p>
                          <a href={img} target="_blank" rel="noreferrer">
                            <img src={img} alt="Evidence" onError={handleImageError} className="max-h-48 rounded-lg border border-blue-200 object-contain" />
                            <span style={{ display: 'none' }} className="text-sm text-red-500 italic">Không thể tải ảnh ({img})</span>
                          </a>
                        </div>
                      )}
                      {img && !img.startsWith('http') && (
                        <p className="text-blue-800 text-sm whitespace-pre-wrap break-words mt-2"><span className="font-semibold">Bằng chứng:</span> {img}</p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 mb-1">Mã đơn hàng</p>
                  <p className="font-medium text-gray-900">{selectedComplaint.orderId}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 mb-1">Tổng tiền đơn</p>
                  <p className="font-semibold text-rose-600">{selectedComplaint.orderTotalAmount.toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 mb-1">Nhà hàng</p>
                  <p className="font-medium text-gray-900">{selectedComplaint.restaurantName}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 mb-1">Tài xế</p>
                  <p className="font-medium text-gray-900">{selectedComplaint.shipperName || 'Chưa có'}</p>
                </div>
              </div>

              {selectedComplaint.status === 'Pending' || selectedComplaint.status === 'Escalated' ? (
                <form id="resolveForm" onSubmit={handleResolve} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quyết định xử lý</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="Dismiss">Từ chối khiếu nại (Không đền bù)</option>
                      <option value="CompensateCustomer">Đền bù hoàn tiền cho khách</option>
                      <option value="SellerFault">Cảnh cáo Nhà hàng (Không hoàn tiền)</option>
                      <option value="ShipperFault">Cảnh cáo/Phạt Tài xế (Không hoàn tiền)</option>
                    </select>
                  </div>

                  {resolutionType === 'CompensateCustomer' && (
                    <div className="p-4 border border-rose-100 bg-rose-50 rounded-xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-rose-900 mb-1">Bên chịu trách nhiệm đền bù</label>
                        <select
                          value={responsibleParty}
                          onChange={(e) => setResponsibleParty(e.target.value)}
                          className="w-full border border-rose-200 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500"
                        >
                          <option value="Restaurant">Nhà hàng</option>
                          <option value="Shipper">Tài xế</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-rose-900 mb-1">Số tiền HOÀN VÍ cho khách</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full border border-rose-200 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-rose-500"
                              required
                            />
                            <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-rose-900 mb-1">Số tiền PHẠT ({responsibleParty === 'Restaurant' ? 'Nhà hàng' : 'Tài xế'})</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              value={deductionAmount}
                              onChange={(e) => setDeductionAmount(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full border border-rose-200 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-rose-500"
                              required
                            />
                            <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {(resolutionType === 'SellerFault' || resolutionType === 'ShipperFault') && resolutionType !== 'CompensateCustomer' && (
                    <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">Số điểm uy tín / Tiền phạt (nếu có)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={deductionAmount}
                            onChange={(e) => setDeductionAmount(Number(e.target.value))}
                            className="w-full border border-amber-200 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-amber-500"
                          />
                          <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú quyết định</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Giải thích lý do xử lý..."
                      required
                    ></textarea>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-500 text-sm mb-2">Trạng thái hiện tại: {getStatusBadge(selectedComplaint.status)}</p>
                  <p className="text-gray-900 font-medium">Đã kết thúc xử lý khiếu nại này.</p>
                </div>
              )}
            </div>

            {selectedComplaint.status === 'Pending' && (
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="resolveForm"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Quyết định'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
