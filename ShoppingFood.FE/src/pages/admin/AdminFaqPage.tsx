import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Modal, Loading } from '../../components/common';
import { faqService } from '../../services';
import type { IFaqDto, ICreateFaqRequest, IUpdateFaqRequest } from '../../interfaces';
import toast from 'react-hot-toast';

/**
 * Trang Quản Lý Câu Hỏi Thường Gặp (AdminFaqPage).
 * Cho phép quản trị viên xây dựng mục Trợ giúp / FAQ cho người dùng:
 * - Danh sách câu hỏi và câu trả lời
 * - Thêm mới câu hỏi thường gặp
 * - Chỉnh sửa nội dung câu hỏi, thứ tự hiển thị và trạng thái kích hoạt
 * - Xóa câu hỏi.
 */
export function AdminFaqPage() {
  const [faqs, setFaqs] = useState<IFaqDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<IFaqDto | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<IFaqDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded State (for viewing answer inline)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchFaqs = useCallback(async () => {
    try {
      setIsLoading(true);
      // Admin lấy toàn bộ (không truyền isActive parameter)
      const res = await faqService.getList();
      if (!res.error && res.data) {
        setFaqs(res.data);
      }
    } catch {
      toast.error('Lỗi khi tải danh sách FAQ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const openAddModal = () => {
    setEditingFaq(null);
    setQuestion('');
    setAnswer('');
    setDisplayOrder(0);
    setIsActive(true);
    setIsOpen(true);
  };

  const openEditModal = (faq: IFaqDto) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setDisplayOrder(faq.displayOrder);
    setIsActive(faq.isActive);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim()) {
      toast.error('Vui lòng nhập câu hỏi');
      return;
    }
    if (!answer.trim()) {
      toast.error('Vui lòng nhập câu trả lời');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingFaq) {
        const payload: IUpdateFaqRequest = {
          question,
          answer,
          displayOrder,
          isActive
        };
        const res = await faqService.update(editingFaq.id, payload);
        if (!res.error) {
          toast.success('Cập nhật FAQ thành công');
          setIsOpen(false);
          fetchFaqs();
        } else {
          toast.error(res.message);
        }
      } else {
        const payload: ICreateFaqRequest = {
          question,
          answer,
          displayOrder
        };
        const res = await faqService.create(payload);
        if (!res.error) {
          toast.success('Thêm FAQ thành công');
          setIsOpen(false);
          fetchFaqs();
        } else {
          toast.error(res.message);
        }
      }
    } catch {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFaq) return;
    setIsDeleting(true);
    try {
      const res = await faqService.delete(deletingFaq.id);
      if (!res.error) {
        toast.success('Xóa FAQ thành công');
        setIsDeleteOpen(false);
        fetchFaqs();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Lỗi kết nối mạng');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý câu hỏi FAQ</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách câu hỏi thường gặp</p>
        </div>
        <Button onClick={openAddModal} className="shrink-0 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Thêm FAQ</span>
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có câu hỏi FAQ nào</h3>
          <p className="text-gray-500 mb-6">Thêm câu hỏi FAQ để hỗ trợ người dùng tốt hơn</p>
          <Button onClick={openAddModal} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Thêm FAQ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map(faq => {
            const isExpanded = expandedIds.has(faq.id);
            return (
              <div key={faq.id} className={`bg-white rounded-2xl shadow-sm border ${faq.isActive ? 'border-gray-100' : 'border-gray-300 bg-gray-50'} overflow-hidden transition-all duration-200`}>
                <div className="p-5 flex items-start gap-4">
                  <div className="mt-1 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold ${faq.isActive ? 'text-gray-900' : 'text-gray-500'} cursor-pointer hover:text-orange-600`} onClick={() => toggleExpand(faq.id)}>
                      {faq.question}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                        Thứ tự: {faq.displayOrder}
                      </span>
                      {!faq.isActive && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                          Đã ẩn
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(faq)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingFaq(faq);
                        setIsDeleteOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleExpand(faq.id)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 pl-[4.25rem] border-t border-gray-50 bg-gray-50">
                    <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm/Sửa FAQ */}
      <Modal
        isOpen={isOpen}
        onClose={() => !isSubmitting && setIsOpen(false)}
        title={editingFaq ? 'Cập nhật FAQ' : 'Thêm FAQ mới'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Câu hỏi"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ví dụ: Làm thế nào để đặt món ăn?"
            required
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Câu trả lời <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-y min-h-[120px]"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Nhập nội dung trả lời chi tiết..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Thứ tự hiển thị (tùy chọn)"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              disabled={isSubmitting}
            />
            {editingFaq && (
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-medium text-gray-700">Hiển thị (Active)</span>
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loading size="sm" /> : 'Lưu thông tin'}
          </Button>
        </div>
      </Modal>

      {/* Modal Xóa */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isDeleting && setIsDeleteOpen(false)}
        title="Xác nhận xóa FAQ"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xóa câu hỏi <span className="font-semibold text-gray-900">"{deletingFaq?.question}"</span> không?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              className="!bg-red-600 hover:!bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loading size="sm" /> : 'Xóa FAQ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
