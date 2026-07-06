import React, { useState, useEffect } from 'react';
import { shipperService } from '../../../services/shipperService';
import type { IShipperReputationHistory } from '../../../interfaces';
import { Loader2, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const ShipperReputationTab: React.FC = () => {
  const [history, setHistory] = useState<IShipperReputationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await shipperService.getReputationHistory();
      if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      toast.error('Lỗi tải lịch sử điểm uy tín');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 border border-orange-200">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Điểm Uy Tín Của Bạn</h3>
        </div>
        <p className="text-sm text-gray-600">
          Điểm uy tín phản ánh chất lượng phục vụ của bạn. Điểm cao giúp bạn có cơ hội nhận được nhiều đơn hàng tốt hơn. 
          Hoàn thành đơn hàng sẽ được cộng điểm, trong khi vi phạm hoặc bị khiếu nại sẽ bị trừ điểm.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h4 className="font-bold text-gray-900">Lịch sử thay đổi điểm</h4>
        </div>
        
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p>Chưa có lịch sử thay đổi điểm uy tín nào.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{item.reason}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                    {item.orderId && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600 font-medium">Đơn: {item.orderId.substring(0, 8).toUpperCase()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                  item.pointChange > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.pointChange > 0 ? (
                    <><ArrowUpRight className="w-4 h-4" /> +{item.pointChange}</>
                  ) : (
                    <><ArrowDownRight className="w-4 h-4" /> {item.pointChange}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
