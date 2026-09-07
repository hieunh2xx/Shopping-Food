import { useState, useEffect } from 'react';
import { Search, Award, Play, Loader2, Shield } from 'lucide-react';
import { Input, Button, Pagination, MemberTierBadge, MemberTierSelectCard, MEMBER_TIERS, getMemberTierLabel } from '../../components/common';
import { Modal } from '../../components/common/Modal';
import { userService } from '../../services/UserService';
import { loyaltyPointService } from '../../services/LoyaltyPointService';
import type { IUserDto } from '../../interfaces';
import { maskEmail, maskPhone } from '../../utils/formatters';
import toast from 'react-hot-toast';

/**
 * Trang Quản Lý Phân Hạng Thành Viên Người Dùng (AdminMemberRanksPage).
 * Giám sát và quản trị cấp bậc hội viên khách hàng:
 * - Xem danh sách khách hàng kèm hạng thành viên (Đồng, Bạc, Vàng, Kim Cương)
 * - Lọc theo hạng thành viên hoặc tìm kiếm theo tên/SĐT
 * - Điều chỉnh nâng/hạ hạng thành viên thủ công cho từng người dùng
 * - Chạy lệnh tính toán và cập nhật hạng tự động toàn sàn.
 */
export function AdminMemberRanksPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [users, setUsers] = useState<IUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [take, setTake] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);


  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserDto | null>(null);
  const [newTier, setNewTier] = useState('Bronze');
  const [isUpdating, setIsUpdating] = useState(false);
  const [revealId, setRevealId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [page, take]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchCustomers();
      else setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, tierFilter]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const skip = (page - 1) * take;
      const res = await userService.getAll({
        skip: 0,
        take: 500,
        filter: search.trim() || undefined,
      });
      if (!res.error && res.data) {
        let list = (res.data as IUserDto[]).filter((u) => u.role === 'Customer');
        if (tierFilter !== 'all') {
          list = list.filter((u) => (u.tier || 'Bronze') === tierFilter);
        }
        setTotal(list.length);
        setUsers(list.slice(skip, skip + take));
      }
    } catch {
      toast.error('Không tải được danh sách hạng thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const res = await loyaltyPointService.evaluateTiers();
      if (!res.error) {
        const n = typeof res.data === 'number' ? res.data : 0;
        toast.success(
          n > 0
            ? `Đã đánh giá lại hạng: ${n} thành viên được cập nhật`
            : 'Đã chạy đánh giá hạng — không có thay đổi trong chu kỳ này'
        );
        fetchCustomers();
      } else {
        toast.error(res.message || 'Đánh giá hạng thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi đánh giá hạng');
    } finally {
      setIsEvaluating(false);
    }
  };

  const openAdjust = (user: IUserDto) => {
    setSelectedUser(user);
    setNewTier(user.tier || 'Bronze');
    setIsTierModalOpen(true);
  };

  const handleAdjustTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const res = await loyaltyPointService.adjustUserTier(selectedUser.id, newTier);
      if (!res.error) {
        toast.success(`Đã cập nhật hạng ${selectedUser.fullName || selectedUser.userName} → ${getMemberTierLabel(newTier)}`);
        setIsTierModalOpen(false);
        fetchCustomers();
      } else {
        toast.error(res.message || 'Cập nhật hạng thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối khi cập nhật hạng');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-orange-500" />
            Đánh giá hạng thành viên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi hạng khách hàng. Hạng tự lên khi đạt mốc điểm; Admin có thể điều chỉnh thủ công.
          </p>
        </div>
        <Button onClick={handleEvaluate} disabled={isEvaluating} className="shadow-md shadow-orange-500/20">
          {isEvaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Chạy đánh giá hạng
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MEMBER_TIERS.map((t) => (
          <MemberTierSelectCard
            key={t}
            tier={t}
            selected={tierFilter === t}
            onClick={() => setTierFilter((prev) => (prev === t ? 'all' : t))}
            subtitle="Lọc theo hạng"
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên / username…"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setTierFilter('all');
            setSearch('');
          }}
        >
          Xóa lọc
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
                <th className="py-4 px-6 font-medium">Thành viên</th>
                <th className="py-4 px-6 font-medium">Email</th>
                <th className="py-4 px-6 font-medium">SĐT</th>
                <th className="py-4 px-6 font-medium text-center">Hạng</th>
                <th className="py-4 px-6 font-medium text-center">Điểm</th>
                <th className="py-4 px-6 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    Không có khách hàng phù hợp
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const revealed = revealId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0 overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-10 h-10 object-cover" />
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
                      <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                        {revealed ? user.email || '—' : maskEmail(user.email)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                        {revealed ? user.phone || '—' : maskPhone(user.phone)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <MemberTierBadge tier={user.tier} />
                      </td>
                      <td className="py-4 px-6 text-center text-xs">
                        <div className="font-semibold text-gray-900">
                          {(user.pointsBalance || 0).toLocaleString('vi-VN')}
                        </div>
                        <div className="text-gray-400">
                          / {(user.totalEarnedPoints || 0).toLocaleString('vi-VN')} tích lũy
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRevealId(revealed ? null : user.id)}
                            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            <Shield className="w-3.5 h-3.5 inline mr-1" />
                            {revealed ? 'Ẩn' : 'Hiện'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjust(user)}
                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
                          >
                            Đổi hạng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={Math.max(1, Math.ceil(total / take))}
              onPageChange={setPage}
              pageSize={take}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={(size) => {
                setTake(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        title="Điều chỉnh hạng thành viên"
        size="sm"
      >
        {selectedUser && (
          <form onSubmit={handleAdjustTier} className="space-y-4">
            <p className="text-sm text-gray-600">
              Thành viên: <strong>{selectedUser.fullName || selectedUser.userName}</strong>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MEMBER_TIERS.map((t) => (
                <MemberTierSelectCard
                  key={t}
                  tier={t}
                  selected={newTier === t}
                  onClick={() => setNewTier(t)}
                />
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsTierModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu hạng'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
