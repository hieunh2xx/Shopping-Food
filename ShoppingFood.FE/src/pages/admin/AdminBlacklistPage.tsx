import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ShieldBan } from 'lucide-react';
import { Button, Input, Modal, Loading } from '../../components/common';
import { adminService } from '../../services';
import toast from 'react-hot-toast';


interface IBlacklistKeyword {
  id: string;
  keyword: string;
  isActive: boolean;
  createdAt: string;
}

export function AdminBlacklistPage() {
  const [keywords, setKeywords] = useState<IBlacklistKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingKeyword, setDeletingKeyword] = useState<IBlacklistKeyword | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getBlacklistKeywords();
      if (!res.error) {
        setKeywords(res.data);
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error('Lỗi khi tải danh sách từ khóa');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.createBlacklistKeyword({ keyword: newKeyword });
      if (!res.error) {
        toast.success('Thêm từ khóa thành công');
        setIsAddOpen(false);
        setNewKeyword('');
        fetchKeywords();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error('Lỗi khi thêm từ khóa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      // Optimistic update
      setKeywords(prev => prev.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k));

      const res = await adminService.toggleBlacklistKeyword(id);
      if (res.error) {
        toast.error(res.message);
        fetchKeywords(); // Revert on failure
      }
    } catch (error: any) {
      toast.error('Lỗi khi cập nhật trạng thái');
      fetchKeywords(); // Revert on failure
    }
  };

  const handleDelete = async () => {
    if (!deletingKeyword) return;
    setIsDeleting(true);
    try {
      const res = await adminService.deleteBlacklistKeyword(deletingKeyword.id);
      if (!res.error) {
        toast.success('Xóa từ khóa thành công');
        setIsDeleteOpen(false);
        setDeletingKeyword(null);
        fetchKeywords();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error('Lỗi khi xóa từ khóa');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldBan className="w-6 h-6 text-red-500" />
            Danh sách từ khóa cấm
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hệ thống sẽ tự động lọc bỏ (ẩn) các từ khóa này trong bình luận, phản hồi và tin nhắn.
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm từ khóa
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-gray-600">Từ khóa</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Ngày tạo</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {keywords.map(kw => (
                <tr key={kw.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{kw.keyword}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggle(kw.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${kw.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${kw.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-gray-500">
                    {new Date(kw.createdAt).toLocaleDateString('vi-VN')} {new Date(kw.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                      onClick={() => {
                        setDeletingKeyword(kw);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {keywords.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Chưa có từ khóa cấm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        title="Thêm từ khóa cấm"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Từ khóa"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Nhập từ khóa cần chặn..."
            autoFocus
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || !newKeyword.trim()}>
              {isSubmitting ? 'Đang thêm...' : 'Thêm'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa từ khóa cấm <span className="font-semibold text-gray-900">"{deletingKeyword?.keyword}"</span> không?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
