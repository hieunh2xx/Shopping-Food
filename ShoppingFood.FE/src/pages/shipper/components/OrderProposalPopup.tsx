import { useEffect, useState } from 'react';
import { Package, MapPin, Store, DollarSign, Clock, X, CheckCircle } from 'lucide-react';
import type { IProposedDeliveryOfferDto } from '../../../interfaces/IShipper';

interface OrderProposalPopupProps {
  offer: IProposedDeliveryOfferDto;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onTimeout: (orderId: string) => void;
}

export function OrderProposalPopup({ offer, onAccept, onReject, onTimeout }: OrderProposalPopupProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeout(offer.orderId);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, offer.orderId, onTimeout]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const progressPercentage = (timeLeft / 60) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
        
        {/* Header with Countdown */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white relative overflow-hidden">
          {/* Progress bar overlay */}
          <div 
            className="absolute bottom-0 left-0 h-1.5 bg-white/30 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h2 className="text-xl font-bold">Đề xuất giao hàng mới!</h2>
              <p className="text-orange-100 text-sm mt-1">Đơn hàng trong khu vực của bạn</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-white text-orange-600 flex flex-col items-center justify-center shadow-lg shrink-0 border-4 border-orange-400 font-bold">
              <span className="text-lg leading-none">{timeLeft}</span>
              <span className="text-[10px] uppercase tracking-wider">Giây</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Income & Distance Highlight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Thu nhập</span>
              </div>
              <p className="text-xl font-extrabold text-orange-700">{formatCurrency(offer.totalIncome)}</p>
              <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-orange-200/50">
                <div className="flex justify-between text-[11px] text-orange-800">
                  <span>Cơ bản:</span>
                  <span className="font-bold">{formatCurrency(offer.baseFee)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-orange-800">
                  <span>Km:</span>
                  <span className="font-bold">{formatCurrency(offer.distanceFee)}</span>
                </div>
                {offer.peakBonus > 0 && (
                  <div className="flex justify-between text-[11px] text-orange-800">
                    <span>Thưởng:</span>
                    <span className="font-bold">{formatCurrency(offer.peakBonus)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Khoảng cách</span>
              </div>
              <p className="text-xl font-extrabold text-blue-700">{offer.distanceInKm.toFixed(1)} km</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Lấy hàng tại</p>
                <p className="font-bold text-gray-900">{offer.restaurantName}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{offer.restaurantAddress}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Giao hàng đến</p>
                <p className="font-bold text-gray-900">{offer.contactName}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{offer.deliveryAddress}</p>
              </div>
            </div>
            
            {/* Items list */}
            {offer.items && offer.items.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết đơn hàng ({offer.items.reduce((sum, item) => sum + item.quantity, 0)} món)</span>
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                  {offer.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[13px]">
                      <div className="flex-1 flex gap-2">
                        <span className="font-bold text-gray-900 shrink-0">{item.quantity}x</span>
                        <span className="text-gray-700 line-clamp-2">{item.itemName}</span>
                      </div>
                      <span className="font-medium text-gray-900 ml-2 shrink-0">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-100">
          <button 
            onClick={() => onReject(offer.orderId)}
            className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Bỏ qua
          </button>
          
          <button 
            onClick={() => onAccept(offer.orderId)}
            className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Nhận đơn
          </button>
        </div>
      </div>
    </div>
  );
}
