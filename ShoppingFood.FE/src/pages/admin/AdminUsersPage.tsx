import { useState, useEffect } from 'react';
import { Search, Shield, Ban, CheckCircle2, Award, Loader2, Star, AlertCircle } from 'lucide-react';
import { Input, Button, Pagination } from '../../components/common';
import { Modal } from '../../components/common/Modal';
import { userService } from '../../services/UserService';
import { loyaltyPointService } from '../../services/LoyaltyPointService';
import type { IUserDto } from '../../interfaces';
import toast from 'react-hot-toast';
import { adminService } from '../../services/AdminService';

const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const TIER_COLORS: Record<string, string> = {
  Bronze: 'bg-amber-100 text-amber-700',
  Silver: 'bg-gray-200 text-gray-700',
  Gold: 'bg-yellow-100 text-yellow-700',
  Platinum: 'bg-blue-100 text-blue-700',
  Diamond: 'bg-purple-100 text-purple-700',
};
const TIER_ICONS: Record<string, string> = {
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '👑',
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<IUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Tier Modal
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserDto | null>(null);
  const [newTier, setNewTier] = useState('Bronze');
  const [isUpdating, setIsUpdating] = useState(false);

  // Complaint History Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Create Staff Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    userName: '',
    password: '',
    email: '',
    phone: '',
    role: 5 // Coordinator by default
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, take]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchUsers();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const res = await userService.getAll({ skip, take, filter: search });
      if (!res.error && res.data) {
        setUsers(res.data as IUserDto[]);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTierModal = (user: IUserDto) => {
    setSelectedUser(user);
    setNewTier(user.tier || 'Bronze');
    setIsTierModalOpen(true);
  };

  const handleOpenHistoryModal = async (user: IUserDto) => {
    setSelectedUser(user);
    setIsHistoryModalOpen(true);
    setIsHistoryLoading(true);
    try {
      const res = await userService.getUserComplaintHistory(user.id);
      if (!res.error && res.data) {
        setHistoryItems(res.data);
      } else {
        toast.error(res.message);
        setHistoryItems([]);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message);
      setHistoryItems([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSubmitTier = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const res = await loyaltyPointService.adjustUserTier(selectedUser.id, newTier);
      if (!res.error) {
        toast.success(`Đã cập nhật hạng ${selectedUser.fullName || selectedUser.userName} thành ${newTier}`);
        setIsTierModalOpen(false);
        fetchUsers();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Thao tác thất bại do lỗi kết nối mạng.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.fullName || !newStaff.userName || !newStaff.password || !newStaff.email || !newStaff.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsCreating(true);
    try {
      const res = await adminService.createStaff(newStaff);
      if (!res.error) {
        toast.success('Tạo tài khoản nội bộ thành công');
        setIsCreateModalOpen(false);
        setNewStaff({ fullName: '', userName: '', password: '', email: '', phone: '', role: 5 });
        fetchUsers();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Tạo tài khoản thất bại do lỗi kết nối mạng.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await adminService.toggleUserStatus(userId);
      if (!res.error) {
        toast.success(res.message);
        fetchUsers();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Cập nhật trạng thái thất bại do lỗi kết nối mạng.');
    } finally { }
  };


  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách khách hàng và đối tác trên hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
          + Tạo tài khoản
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-96 relative">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm email, tên người dùng..."
            className="pl-10"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Tổng: <span className="font-semibold text-gray-900 ml-1">{total}</span> người dùng
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Người dùng</th>
                <th className="py-4 px-6 font-medium">Email</th>
                <th className="py-4 px-6 font-medium">Vai trò</th>
                <th className="py-4 px-6 font-medium text-center">Hạng thành viên</th>
                <th className="py-4 px-6 font-medium text-center">Điểm</th>
                <th className="py-4 px-6 font-medium text-center">Trạng thái</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            (user.fullName || user.userName || '?').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.fullName || user.userName}</div>
                          <div className="text-xs text-gray-400">@{user.userName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">{user.email || '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'Seller' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'Mall' ? 'bg-orange-100 text-orange-700 font-bold' :
                          user.role === 'Shipper' ? 'bg-teal-100 text-teal-700' :
                          user.role === 'Coordinator' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {user.role === 'Admin' && <Shield className="w-3 h-3" />}
                        {user.role === 'Seller' ? 'Đối tác' : 
                         user.role === 'Mall' ? 'Mall' :
                         user.role === 'Customer' ? 'Khách hàng' : 
                         user.role === 'Shipper' ? 'Tài xế' : 
                         user.role === 'Coordinator' ? 'Điều phối viên' : 
                         user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {user.role === 'Customer' ? (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${TIER_COLORS[user.tier || ''] || 'bg-gray-100 text-gray-600'}`}>
                          <span>{TIER_ICONS[user.tier || ''] || '🎖️'}</span>
                          {user.tier || 'Chưa có'}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {user.role === 'Customer' ? (
                        <div className="text-xs">
                          <div className="font-semibold text-gray-900">{(user.pointsBalance || 0).toLocaleString()}</div>
                          <div className="text-gray-400">/ {(user.totalEarnedPoints || 0).toLocaleString()} tích lũy</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        user.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        user.status === 'Blocked' || user.status === 'Banned' ? 'bg-red-100 text-red-700' : 
                        user.status === 'Pending' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                        }`}>
                        {user.status === 'Active' ? 'Hoạt động' : 
                         user.status === 'Blocked' || user.status === 'Banned' ? 'Bị khóa' : 
                         user.status === 'Pending' ? 'Chờ duyệt' : 
                         user.status === 'Inactive' ? 'Ngừng hoạt động' : 
                         user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Xem lịch sử khiếu nại"
                          onClick={() => handleOpenHistoryModal(user)}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                        {user.role === 'Customer' && (
                          <button
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Sửa hạng thành viên"
                            onClick={() => handleOpenTierModal(user)}
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        {user.role !== 'Admin' && (
                          user.status === 'Active' ? (
                            <button
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Khóa tài khoản"
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              className="text-gray-400 hover:text-green-500 transition-colors"
                              title="Mở khóa tài khoản"
                              onClick={() => handleToggleStatus(user.id)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / take)}
            onPageChange={setPage}
            pageSize={take}
            pageSizeOptions={[10, 20, 50]}
            onPageSizeChange={(size) => { setTake(size); setPage(1); }}
          />
        </div>
      </div>

      {/* Tier Adjustment Modal */}
      <Modal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} title="Sửa hạng thành viên">
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  (selectedUser.fullName || selectedUser.userName || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{selectedUser.fullName || selectedUser.userName}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_COLORS[selectedUser.tier || ''] || 'bg-gray-100 text-gray-600'}`}>
                    {TIER_ICONS[selectedUser.tier || ''] || '🎖️'} {selectedUser.tier || 'Chưa có'}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{(selectedUser.totalEarnedPoints || 0).toLocaleString()} điểm tích lũy</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chọn hạng mới</label>
              <div className="grid grid-cols-5 gap-2">
                {TIERS.map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setNewTier(tier)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${newTier === tier
                        ? 'border-orange-500 bg-orange-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <span className="text-xl">{TIER_ICONS[tier]}</span>
                    <span className={`text-xs font-semibold ${newTier === tier ? 'text-orange-600' : 'text-gray-600'}`}>{tier}</span>
                  </button>
                ))}
              </div>
            </div>

            {newTier !== selectedUser.tier && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <Star className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-sm text-orange-700">
                  Thay đổi: <strong>{selectedUser.tier || 'Chưa có'}</strong> → <strong>{newTier}</strong>
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTierModalOpen(false)}>Hủy</Button>
              <Button
                onClick={handleSubmitTier}
                disabled={isUpdating || newTier === selectedUser.tier}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Lịch sử khiếu nại của ${selectedUser?.fullName || selectedUser?.userName}`}>
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Tổng số khiếu nại</h3>
                <p className="text-sm text-purple-700">Người dùng này đã gửi tổng cộng {historyItems.length} khiếu nại.</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-700">{historyItems.length}</div>
          </div>

          {isHistoryLoading ? (
            <div className="py-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
              Đang tải lịch sử...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Chưa ghi nhận khiếu nại nào từ người dùng này.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
              {historyItems.map((item, index) => (
                <div key={index} className="p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {item.status === 'Resolved' ? 'Đã giải quyết' : item.status === 'Pending' ? 'Chờ xử lý' : item.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{item.description}</p>
                  <div className="flex justify-between items-center text-[11px] text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      Loại: {item.incidentType === 'OrderComplaint' ? 'Đơn hàng' : item.incidentType === 'RestaurantComplaint' ? 'Nhà hàng' : item.incidentType === 'ShipperComplaint' ? 'Tài xế' : item.incidentType}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => setIsHistoryModalOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      {/* Create Staff Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Tạo tài khoản nội bộ">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <Input required value={newStaff.fullName} onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
            <Input required value={newStaff.userName} onChange={e => setNewStaff({ ...newStaff, userName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <Input required type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input required type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <Input required value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
              value={newStaff.role}
              onChange={e => setNewStaff({ ...newStaff, role: Number(e.target.value) })}
            >
              <option value={5}>Điều phối viên (Coordinator)</option>
              {/* <option value={0}>Quản trị viên (Admin)</option> */}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isCreating} className="bg-orange-500 hover:bg-orange-600 text-white">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
