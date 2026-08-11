import { useState, useEffect } from 'react';
import { Award, Gift, ArrowRightLeft, History } from 'lucide-react';
import { loyaltyPointService } from '../../services/LoyaltyPointService';
import { pointGiftConfigService } from '../../services/PointGiftConfigService';
import type { ILoyaltyPointDto, IPointGiftConfigDto } from '../../interfaces';
import toast from 'react-hot-toast';
import { Button, Modal } from '../common';

export function CustomerLoyalty() {
  const [loyaltyData, setLoyaltyData] = useState<ILoyaltyPointDto | null>(null);
  const [gifts, setGifts] = useState<IPointGiftConfigDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeemingGiftId, setRedeemingGiftId] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onFocus = () => fetchData();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    const onNotif = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const type = detail?.notificationType || detail?.NotificationType || '';
      const title = detail?.title || detail?.Title || '';
      const message = detail?.message || detail?.Message || '';
      if (
        String(type).toLowerCase() === 'loyalty'
        || String(type).toLowerCase().includes('loyalty')
        || String(title).includes('điểm')
        || String(message).includes('điểm thưởng')
        || String(message).includes('tích lũy')
      ) {
        fetchData();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('ON_REALTIME_NOTIFICATION', onNotif as EventListener);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('ON_REALTIME_NOTIFICATION', onNotif as EventListener);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [loyaltyRes, giftsRes] = await Promise.all([
        loyaltyPointService.getLoyaltyPoints(),
        pointGiftConfigService.getActiveGiftsForCustomer()
      ]);

      if (!loyaltyRes.error && loyaltyRes.data) {
        setLoyaltyData(loyaltyRes.data);
      } else if (loyaltyRes.error) {
        toast.error(loyaltyRes.message || 'Không tải được điểm thưởng');
      }
      if (!giftsRes.error && giftsRes.data) {
        setGifts(giftsRes.data);
      }
    } catch {
      toast.error('Không tải được điểm thưởng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemGift = (giftId: string) => {
    setRedeemingGiftId(giftId);
  };

  const confirmRedeem = async () => {
    if (!redeemingGiftId) return;
    setIsRedeeming(true);
    try {
      const res = await loyaltyPointService.redeemGift({ pointGiftConfigId: redeemingGiftId });
      if (!res.error) {
        toast.success('Đổi điểm thưởng thành công! Voucher đã được thêm vào kho quà của bạn.');
        fetchData(); // refresh points
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Đổi quà thất bại do lỗi kết nối mạng.');
    } finally {
      setIsRedeeming(false);
      setRedeemingGiftId(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch(tier?.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver': return 'bg-gray-200 text-gray-800 border-gray-300';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'diamond': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="text-center p-6 text-gray-500">Đang tải điểm tích lũy...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Award className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getTierColor(loyaltyData?.tier || 'Bronze')}`}>
              Hạng {loyaltyData?.tier || 'Bronze'}
            </span>
          </div>
          <div className="mb-2">
            <p className="text-orange-100 text-sm font-medium mb-1">Điểm hiện có</p>
            <h2 className="text-4xl font-black">{loyaltyData?.pointsBalance?.toLocaleString() || 0} <span className="text-xl font-semibold opacity-80">điểm</span></h2>
          </div>
          <p className="text-sm text-orange-100">Tổng điểm tích lũy: {loyaltyData?.totalEarnedPoints?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Gifts Catalog */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          Đổi điểm nhận quà
        </h3>
        {gifts.length === 0 ? (
          <p className="text-gray-500 text-sm">Hiện chưa có quà tặng nào để đổi.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gifts.map(gift => {
              const canRedeem = (loyaltyData?.pointsBalance || 0) >= gift.pointRequired;
              return (
                <div key={gift.id} className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-gray-900 line-clamp-1">{gift.discountTitle}</h4>
                    <p className="text-sm text-gray-600 mt-1">Giảm {gift.discountType === 'Percentage' ? `${gift.discountValue}%` : `${gift.discountValue.toLocaleString()}đ`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Mã: {gift.discountCode}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-orange-500">{gift.pointRequired} điểm</span>
                    <Button 
                      size="sm" 
                      disabled={!canRedeem} 
                      onClick={() => handleRedeemGift(gift.id)}
                      className="flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Đổi quà
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-orange-500" />
          Lịch sử điểm thưởng
        </h3>
        {!loyaltyData?.history || loyaltyData.history.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có lịch sử nhận/đổi điểm.</p>
        ) : (
          <div className="space-y-3">
            {loyaltyData.history.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {item.description.replace(/#([a-fA-F0-9\-]{36})/g, (_match, p1) => '#' + p1.substring(0, 8).toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className={`font-bold text-sm ${['EarnFromOrder', 'Earned', 'AdminAdjustment'].includes(item.transactionType) && item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {['EarnFromOrder', 'Earned', 'AdminAdjustment'].includes(item.transactionType) && item.points >= 0 ? '+' : '-'}{Math.abs(item.points)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!redeemingGiftId}
        onClose={() => !isRedeeming && setRedeemingGiftId(null)}
        title="Xác nhận đổi quà"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Bạn có chắc chắn muốn sử dụng điểm thưởng để đổi phần quà này không?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setRedeemingGiftId(null)}
              disabled={isRedeeming}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={confirmRedeem}
              isLoading={isRedeeming}
            >
              Đổi quà ngay
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
