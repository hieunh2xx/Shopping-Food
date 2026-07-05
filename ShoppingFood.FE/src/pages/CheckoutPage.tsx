import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store, MapPin, Phone, User, Mail, ShieldCheck, ArrowLeft, Loader2, X } from 'lucide-react';
import { useCart, useAuth } from '../hooks';
import { Button, Input } from '../components/common';
import { ROUTES } from '../routes/routeConfig';
import { formatCurrency } from '../utils/formatters';
import { orderService } from '../services/OrderService';
import { discountService } from '../services/DiscountService';
import type { IDiscountDto } from '../interfaces';
import toast from 'react-hot-toast';
import { Modal } from '../components/common/Modal';
import { Tag } from 'lucide-react';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  
  const [searchParams] = useSearchParams();
  
  // Get guest ID from localStorage if not authenticated
  const guestUserId = !isAuthenticated ? localStorage.getItem('sf_guest_id') || undefined : undefined;

  const urlRestaurantId = searchParams.get('restaurantId');
  const fallbackRestaurantId = items.length > 0 ? items[0].product.restaurantId : null;
  const restaurantId = urlRestaurantId || fallbackRestaurantId;
  
  const firstItemOfRestaurant = items.find(i => i.product.restaurantId === restaurantId);
  const restaurantName = firstItemOfRestaurant ? firstItemOfRestaurant.product.restaurantName : '';
  const checkoutItems = items.filter(i => i.product.restaurantId === restaurantId);
  
  const checkoutTotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      let itemPrice = item.product.price;
      if (item.selectedSize) {
        const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
        if (sizeOpt) itemPrice += sizeOpt.extraPrice;
      }
      if (item.selectedToppings && item.selectedToppings.length > 0) {
        item.selectedToppings.forEach(topName => {
          const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
          if (topOpt) itemPrice += topOpt.price;
        });
      }
      return sum + (itemPrice * item.quantity);
    }, 0);
  }, [checkoutItems]);

  const [formData, setFormData] = useState({
    contactName: user?.fullName || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    deliveryAddress: '',
    note: '',
    paymentMethod: 'COD' as 'COD' | 'CreditCard' | 'EWallet',
    discountCode: ''
  });

  const [availableDiscounts, setAvailableDiscounts] = useState<IDiscountDto[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<IDiscountDto | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Info, 2: OTP (if guest)
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      toast('Giỏ hàng trống, quay lại trang chủ');
      navigate(ROUTES.HOME);
    }
  }, [items, navigate]);

  useEffect(() => {
    if (restaurantId) {
      discountService.getDiscounts({ restaurantId, take: 50 }).then(res => {
        if (!res.error && res.data) {
          setAvailableDiscounts(res.data.filter(d => d.status === 'Active' && d.minOrderAmount <= checkoutTotal));
        }
      });
    }
  }, [restaurantId, checkoutTotal]);

  const finalTotal = useMemo(() => {
    if (!selectedDiscount) return checkoutTotal;
    let discountAmount = 0;
    if (selectedDiscount.type === 'Percentage') {
      discountAmount = (checkoutTotal * selectedDiscount.value) / 100;
      if (selectedDiscount.maxDiscountAmount && discountAmount > selectedDiscount.maxDiscountAmount) {
        discountAmount = selectedDiscount.maxDiscountAmount;
      }
    } else if (selectedDiscount.type === 'FixedAmount') {
      discountAmount = selectedDiscount.value;
    }
    // Note: FreeShipping logic would require shipping fee calculation first
    return Math.max(0, checkoutTotal - discountAmount);
  }, [checkoutTotal, selectedDiscount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = async () => {
    if (!formData.contactName || !formData.contactPhone || !formData.deliveryAddress || !formData.contactEmail) {
      toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (!isAuthenticated) {
      setIsSubmitting(true);
      try {
        await orderService.sendCheckoutOtp({
          fullName: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
          deliveryAddress: formData.deliveryAddress,
          guestUserId
        });
        toast.success('Mã OTP đã được gửi đến email của bạn');
        setStep(2);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Lỗi khi gửi mã OTP');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If authenticated, maybe skip OTP or directly checkout
      handleCheckout();
    }
  };

  const handleApplyCode = async () => {
    if (!formData.discountCode) return;
    try {
      const res = await discountService.applyDiscount({
        code: formData.discountCode,
        restaurantId,
        cartAmount: checkoutTotal
      });
      if (!res.error && res.data) {
        toast.success('Áp dụng mã giảm giá thành công');
        setSelectedDiscount({
          id: res.data.discountId,
          code: res.data.code,
          type: 'FixedAmount', // Force FixedAmount so frontend logic simply subtracts the value
          value: res.data.discountAmount,
        } as IDiscountDto);
        setIsDiscountModalOpen(false);
      } else {
        toast.error(res.message || 'Mã giảm giá không hợp lệ');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi áp mã');
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated && !otpCode) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      await orderService.checkout({
        ...formData,
        otpCode: isAuthenticated ? '' : otpCode,
        guestUserId,
        discountCode: selectedDiscount?.code || formData.discountCode
      });
      const orderId = res.data?.orderId || res.data?.OrderId || '';
      clearCart();
      if (isAuthenticated) {
        toast.success('Đặt hàng thành công!');
        navigate(ROUTES.ORDERS);
      } else {
        toast.success(
          `Đặt hàng thành công! Mã đơn hàng của bạn là: ${orderId}. Vui lòng lưu lại mã này.`,
          { duration: 10000 }
        );
        navigate(`${ROUTES.GUEST_ORDER_TRACKING}?orderId=${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Store className="w-6 h-6 mr-3 text-orange-500" />
                Thông tin giao hàng
              </h2>

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <User className="w-4 h-4 mr-1.5 text-gray-400" /> Họ và tên
                      </label>
                      <Input 
                        name="contactName" 
                        value={formData.contactName} 
                        onChange={handleInputChange} 
                        placeholder="VD: Nguyễn Văn A" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Phone className="w-4 h-4 mr-1.5 text-gray-400" /> Số điện thoại
                      </label>
                      <Input 
                        name="contactPhone" 
                        value={formData.contactPhone} 
                        onChange={handleInputChange} 
                        placeholder="VD: 0901234567" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Mail className="w-4 h-4 mr-1.5 text-gray-400" /> Email
                    </label>
                    <Input 
                      name="contactEmail" 
                      type="email"
                      value={formData.contactEmail} 
                      onChange={handleInputChange} 
                      placeholder="VD: email@example.com" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-400" /> Địa chỉ giao hàng
                    </label>
                    <Input 
                      name="deliveryAddress" 
                      value={formData.deliveryAddress} 
                      onChange={handleInputChange} 
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                    <textarea 
                      name="note" 
                      value={formData.note} 
                      onChange={handleInputChange} 
                      placeholder="Ghi chú thêm cho nhà hàng hoặc tài xế..." 
                      className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none min-h-[100px] p-4 text-base transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Phương thức thanh toán</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['COD', 'CreditCard', 'EWallet'].map((method) => (
                        <label 
                          key={method}
                          className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                            formData.paymentMethod === method 
                              ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' 
                              : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value={method} 
                            checked={formData.paymentMethod === method}
                            onChange={handleInputChange}
                            className="sr-only" 
                          />
                          <span className="font-medium text-sm">
                            {method === 'COD' ? 'Tiền mặt' : method === 'CreditCard' ? 'Thẻ tín dụng' : 'Ví điện tử'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={handleNextStep} 
                    disabled={isSubmitting}
                    className="w-full mt-6 h-12 text-lg font-semibold rounded-xl bg-orange-600 hover:bg-orange-700"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isAuthenticated ? 'Đặt hàng ngay' : 'Tiếp tục')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Xác thực Email</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Chúng tôi đã gửi một mã OTP gồm 6 số đến email <strong>{formData.contactEmail}</strong>. 
                        Vui lòng kiểm tra hộp thư và nhập mã vào bên dưới để hoàn tất đặt hàng.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác thực OTP</label>
                    <Input 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)} 
                      placeholder="Nhập mã OTP..." 
                      className="text-center tracking-widest text-lg font-bold"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setStep(1)} 
                      className="flex-1 rounded-xl h-12"
                    >
                      Quay lại
                    </Button>
                    <Button 
                      onClick={handleCheckout} 
                      disabled={isSubmitting || otpCode.length < 4}
                      className="flex-1 rounded-xl h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Xác nhận Đặt hàng'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
                Tóm tắt đơn hàng
                <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full">
                  {checkoutItems.length} món
                </span>
              </h2>
              
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100">
                <Store className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-gray-800">{restaurantName}</span>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {checkoutItems.map((item, idx) => {
                  let itemUnitPrice = item.product.price;
                  if (item.selectedSize) {
                    const sizeOpt = item.product.sizes?.find(s => s.sizeName === item.selectedSize);
                    if (sizeOpt) itemUnitPrice += sizeOpt.extraPrice;
                  }
                  if (item.selectedToppings && item.selectedToppings.length > 0) {
                    item.selectedToppings.forEach(topName => {
                      const topOpt = item.product.toppings?.find(t => t.name === topName || (t as any).toppingName === topName);
                      if (topOpt) itemUnitPrice += topOpt.price;
                    });
                  }

                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                         {item.product.primaryImageUrl ? (
                          <img src={item.product.primaryImageUrl} alt={item.product.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🍜</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.itemName}</h4>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          {item.selectedSize && <div>Size: {item.selectedSize}</div>}
                          {item.selectedToppings?.length ? <div>Thêm: {item.selectedToppings.join(', ')}</div> : null}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-semibold text-gray-600">x{item.quantity}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(itemUnitPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-gray-700 cursor-pointer" onClick={() => setIsDiscountModalOpen(true)}>
                    <Tag className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-sm">Khuyến mãi</span>
                  </div>
                  <div className="text-sm font-semibold text-orange-600 flex items-center gap-1 cursor-pointer">
                    {selectedDiscount ? (
                      <div className="flex items-center gap-2 bg-orange-50 pl-3 pr-1.5 py-1 rounded-full border border-orange-100">
                        <span onClick={() => setIsDiscountModalOpen(true)}>{selectedDiscount.code}</span>
                        <div 
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDiscount(null);
                            setFormData({...formData, discountCode: ''});
                            toast.success('Đã gỡ mã giảm giá');
                          }}
                        >
                          <X className="w-3 h-3 text-orange-600" />
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => setIsDiscountModalOpen(true)} className="flex items-center gap-1">
                        <span>Chọn mã</span>
                        <span className="text-gray-400 text-xs ml-1">›</span>
                      </div>
                    )} 
                  </div>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">{formatCurrency(checkoutTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí giao hàng</span>
                  <span className="font-medium">---</span>
                </div>
                {selectedDiscount && selectedDiscount.type !== 'FreeShipping' && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({selectedDiscount.code})</span>
                    <span className="font-medium">-{formatCurrency(checkoutTotal - finalTotal)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-orange-600 text-2xl">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Mã giảm giá">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nhập mã giảm giá..." value={formData.discountCode} onChange={(e) => { handleInputChange(e); setSelectedDiscount(null); }} className="flex-1" />
            <Button onClick={handleApplyCode}>Áp dụng</Button>
          </div>
          <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
            {availableDiscounts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Chưa có mã giảm giá phù hợp cho đơn hàng này.</p>
            ) : (
              availableDiscounts.map(discount => (
                <div key={discount.id} onClick={() => { setSelectedDiscount(discount); setFormData({...formData, discountCode: discount.code}); setIsDiscountModalOpen(false); }} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{discount.code}</div>
                      <div className="text-xs text-gray-500">{discount.title}</div>
                    </div>
                  </div>
                  <div className="text-orange-600 text-sm font-semibold">Chọn</div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
