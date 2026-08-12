import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { orderService } from '../../services';
import { Button, Loading, Modal } from '../../components/common';

interface ShipperCancelItem {
  orderId: string;
  shortId: string;
  cancelledAt: string;
  totalAmount: number;
  contactName?: string;
  deliveryAddress?: string;
  shipperName?: string;
  rejectReason: string;
  reasonLabel: string;
}

interface ShipperCancelsPayload {
  days: number;
  total: number;
  statsByReason: { reason: string; count: number }[];
  items: ShipperCancelItem[];
}

export function SellerShipperCancelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ShipperCancelsPayload | null>(null);
  const [selected, setSelected] = useState<ShipperCancelItem | null>(null);

  const fetchData = useCallback(async (rangeDays: number) => {
    setLoading(true);
    try {
      const res = await orderService.getSellerShipperCancels({ days: rangeDays });
      if (!res.error && res.data) {
        setData(res.data as ShipperCancelsPayload);
      } else {
        toast.error(res.message || 'Không tải được danh sách');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Lỗi kết nối khi tải đơn hủy bởi tài xế';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(days);
  }, [days, fetchData]);

  useEffect(() => {
    if (!data?.items?.length) return;
    const orderId = searchParams.get('orderId');
    if (!orderId) return;
    const match = data.items.find(
      (i) => i.orderId === orderId || i.orderId.toLowerCase().startsWith(orderId.toLowerCase().slice(0, 8))
    );
    if (match) setSelected(match);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('orderId');
      return next;
    }, { replace: true });
  }, [data, searchParams, setSearchParams]);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-orange-500" />
            Đơn hủy bởi tài xế
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng kết đơn bị tài xế báo giao thất bại / hủy, kèm lý do đầy đủ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => void fetchData(days)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tổng đơn hủy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{data?.total ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">{days} ngày gần đây</p>
            </div>
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-gray-800">Theo lý do</p>
              </div>
              {(data?.statsByReason?.length ?? 0) === 0 ? (
                <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data!.statsByReason.map((s) => (
                    <span
                      key={s.reason}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 text-xs font-medium border border-orange-100"
                    >
                      {s.reason}
                      <span className="font-bold">{s.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="py-3 px-4 font-semibold">Mã đơn</th>
                    <th className="py-3 px-4 font-semibold">Thời gian</th>
                    <th className="py-3 px-4 font-semibold">Tài xế</th>
                    <th className="py-3 px-4 font-semibold">Lý do</th>
                    <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                    <th className="py-3 px-4 font-semibold text-center">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.items ?? []).map((item) => (
                    <tr key={item.orderId} className="hover:bg-orange-50/40">
                      <td className="py-3 px-4 font-mono text-sm font-semibold text-gray-800">#{item.shortId}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(item.cancelledAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-800">{item.shipperName || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate" title={item.rejectReason}>
                        {item.rejectReason || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">
                        {formatMoney(item.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(data?.items?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        Không có đơn hủy bởi tài xế trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết đơn hủy bởi tài xế">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Mã đơn</p>
                <p className="font-mono font-semibold">#{selected.shortId}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Thời gian hủy</p>
                <p className="font-medium">{new Date(selected.cancelledAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Tài xế</p>
                <p className="font-medium">{selected.shipperName || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Tổng tiền</p>
                <p className="font-medium">{formatMoney(selected.totalAmount)}</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Lý do đầy đủ</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{selected.rejectReason || '—'}</p>
            </div>
            <div className="text-sm text-gray-600">
              <p><span className="text-gray-500">Khách:</span> {selected.contactName || '—'}</p>
              <p className="mt-1"><span className="text-gray-500">Địa chỉ:</span> {selected.deliveryAddress || '—'}</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelected(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
