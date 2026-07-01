import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Zap, Plus, Search } from 'lucide-react';
import { flashSaleService } from '../../services/FlashSaleService';
import type { IFlashSale } from '../../services/FlashSaleService';
import { productService } from '../../services/ProductService';
import { Button, Input, Modal } from '../../components/common';
import { formatDate } from '../../utils/formatters';

export function SellerFlashSalesPage() {
  const [flashSales, setFlashSales] = useState<IFlashSale[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  
  const [formData, setFormData] = useState<{
    productId: string;
    flashSalePrice: number | '';
    quantityLimit: number | '';
  }>({
    productId: '',
    flashSalePrice: '',
    quantityLimit: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fsRes, pRes] = await Promise.all([
        flashSaleService.getActiveFlashSales(),
        productService.search({ skip: 0, take: 100 })
      ]);
      
      if (!fsRes.error && fsRes.data) {
        setFlashSales(fsRes.data);
      }
      if (!pRes.error && pRes.data) {
        setProducts(pRes.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = (saleId: string) => {
    setSelectedSaleId(saleId);
    setFormData({ productId: '', flashSalePrice: '', quantityLimit: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.flashSalePrice || !formData.quantityLimit || Number(formData.flashSalePrice) <= 0 || Number(formData.quantityLimit) <= 0) {
      toast.error('Vui lòng nhập thông tin hợp lệ');
      return;
    }

    try {
      const res = await flashSaleService.registerFlashSale({
        flashSaleId: selectedSaleId,
        productId: formData.productId,
        flashSalePrice: Number(formData.flashSalePrice),
        quantityLimit: Number(formData.quantityLimit)
      });

      if (!res.error) {
        toast.success('Đăng ký sản phẩm thành công!');
        setIsModalOpen(false);
      } else {
        toast.error(res.message || 'Lỗi khi đăng ký sản phẩm');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống khi đăng ký');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Đăng ký Flash Sale
          </h1>
          <p className="text-sm text-gray-500 mt-1">Đăng ký sản phẩm tham gia các chương trình Flash Sale của sàn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-gray-500">Đang tải danh sách chương trình...</div>
        ) : flashSales.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Hiện tại không có chương trình Flash Sale nào đang mở đăng ký.</div>
        ) : (
          flashSales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-bl-xl">
                HOT
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{sale.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{sale.description || 'Chương trình siêu sale hấp dẫn'}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bắt đầu:</span>
                    <span className="font-medium text-gray-900">{formatDate(sale.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Kết thúc:</span>
                    <span className="font-medium text-gray-900">{formatDate(sale.endDate)}</span>
                  </div>
                </div>
                <Button className="w-full" onClick={() => handleRegisterClick(sale.id)}>
                  Đăng ký tham gia
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Đăng ký sản phẩm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn sản phẩm</label>
            <select
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.itemName} - Giá gốc: {p.price.toLocaleString()}đ</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá Flash Sale (VNĐ)</label>
            <Input
              type="number"
              min="0"
              value={formData.flashSalePrice}
              onChange={(e) => setFormData({ ...formData, flashSalePrice: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tham gia</label>
            <Input
              type="number"
              min="1"
              value={formData.quantityLimit}
              onChange={(e) => setFormData({ ...formData, quantityLimit: e.target.value === '' ? '' : Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button type="submit">Xác nhận</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
