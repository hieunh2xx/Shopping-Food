import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Zap, Clock, PlayCircle } from 'lucide-react';
import { flashSaleService } from '../../services/FlashSaleService';
import type { IFlashSale, ICreateFlashSaleRequest } from '../../services/FlashSaleService';
import { Button, Input, Modal } from '../../components/common';
import { formatDate } from '../../utils/formatters';

export function AdminFlashSalePage() {
  const [flashSales, setFlashSales] = useState<IFlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ICreateFlashSaleRequest>({
    name: '',
    startTime: '',
    endTime: '',
    description: ''
  });

  useEffect(() => {
    fetchFlashSales();
  }, []);

  const fetchFlashSales = async () => {
    try {
      const res = await flashSaleService.getAllFlashSales();
      if (!res.error && res.data) {
        setFlashSales(res.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách Flash Sale');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    try {
      const res = await flashSaleService.createFlashSale(formData);
      if (!res.error) {
        toast.success('Tạo chương trình Flash Sale thành công!');
        setIsModalOpen(false);
        fetchFlashSales();
      } else {
        toast.error(res.message || 'Lỗi khi tạo Flash Sale');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi tạo Flash Sale');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình này?')) return;
    
    try {
      const res = await flashSaleService.deleteFlashSale(id);
      if (!res.error) {
        toast.success('Đã xóa thành công');
        fetchFlashSales();
      } else {
        toast.error(res.message || 'Lỗi khi xóa Flash Sale');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi xóa');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Cấu hình Flash Sale
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý các chương trình Flash Sale giờ vàng</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tạo chương trình mới
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-sm font-semibold text-gray-600">Tên chương trình</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Thời gian bắt đầu</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Thời gian kết thúc</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : flashSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Chưa có chương trình Flash Sale nào</td>
                </tr>
              ) : (
                flashSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{sale.name}</td>
                    <td className="p-4 text-gray-600">{formatDate(sale.startTime)}</td>
                    <td className="p-4 text-gray-600">{formatDate(sale.endTime)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        sale.status === 'Active' ? 'bg-green-100 text-green-700' :
                        sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {sale.status === 'Active' ? 'Đang diễn ra' : 
                         sale.status === 'Pending' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo chương trình Flash Sale"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Flash Sale Giờ Vàng"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
            <textarea
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chương trình..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>
              Tạo chương trình
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
