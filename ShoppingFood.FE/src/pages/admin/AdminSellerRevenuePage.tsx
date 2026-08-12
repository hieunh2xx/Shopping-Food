import { useCallback, useEffect, useState } from 'react';
import { Store, TrendingUp, DollarSign, Truck, Info, CreditCard } from 'lucide-react';
import { Card } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

type PeriodDays = 7 | 30;

export function AdminSellerRevenuePage() {
  const [days, setDays] = useState<PeriodDays>(30);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (days - 1));
      const res = await paymentService.getSellerRevenues({
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        restaurantId: restaurantId || undefined,
      });
      if (!res.error) setData(res.data);
      else toast.error(res.message);
    } finally {
      setLoading(false);
    }
  }, [days, restaurantId]);

  useEffect(() => { load(); }, [load]);

  const summary = data?.summary;
  const sellers = data?.sellers || [];
  const restaurants = data?.restaurants || [];
  const detail = data?.detail;
  const formula = data?.incomeFormula;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doanh thu theo nhà hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lọc từng seller · món bán · COD / trả trước · chiết khấu · shipper
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-[220px]"
          >
            <option value="">Tất cả nhà hàng</option>
            {restaurants.map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as PeriodDays)}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${days === d ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {d} Ngày
            </button>
          ))}
        </div>
      </div>

      {formula && (
        <Card className="p-5 border border-blue-100 bg-blue-50/40">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold text-blue-900">Cách tính tiền (không trùng với “phí ship khách trả”)</p>
              <p>{formula.note}</p>
              <p><strong>Khách trả phí ship:</strong> {formula.customerShipping}</p>
              <p><strong>Shipper nhận:</strong> {formula.shipperIncome}</p>
              <p>
                Hiện tại: Base <strong>{formatCurrency(formula.shipperBaseFee || 0)}</strong>
                {' '}+ max(0, km−{formula.freeDistanceKmForShipper}) × <strong>{formatCurrency(formula.shipperFeePerKm || 0)}</strong>/km
              </p>
              <p><strong>Sàn:</strong> {formula.platformCommission}</p>
              <p><strong>Seller:</strong> {formula.sellerPayout}</p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {[
              { label: 'Seller', value: summary?.sellerCount ?? 0, icon: Store },
              { label: 'Tổng đơn', value: summary?.totalOrders ?? 0, icon: TrendingUp },
              { label: 'COD', value: summary?.totalCodOrders ?? 0, icon: CreditCard },
              { label: 'Trả trước', value: summary?.totalPrepaidOrders ?? 0, icon: CreditCard },
              { label: 'GMV', value: formatCurrency(summary?.totalGmv || 0), icon: DollarSign },
              { label: 'Trả seller', value: formatCurrency(summary?.totalSellerPayout || 0), icon: Store },
              { label: 'Shipper nhận', value: formatCurrency(summary?.totalShipperIncome || 0), icon: Truck },
            ].map((s, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <s.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {!restaurantId && (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Nhà hàng</th>
                      <th className="px-4 py-3 font-medium text-right">Đơn</th>
                      <th className="px-4 py-3 font-medium text-right">COD</th>
                      <th className="px-4 py-3 font-medium text-right">Trả trước</th>
                      <th className="px-4 py-3 font-medium text-right">GMV</th>
                      <th className="px-4 py-3 font-medium text-right">Chiết khấu</th>
                      <th className="px-4 py-3 font-medium text-right">Seller</th>
                      <th className="px-4 py-3 font-medium text-right">Shipper</th>
                      <th className="px-4 py-3 font-medium text-right">Phí ship KH</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sellers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                          Chưa có đơn Delivered trong kỳ
                        </td>
                      </tr>
                    ) : (
                      sellers.map((s: any) => (
                        <tr key={s.restaurantId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{s.restaurantName}</td>
                          <td className="px-4 py-3 text-right">{s.orderCount}</td>
                          <td className="px-4 py-3 text-right">{s.codOrders}</td>
                          <td className="px-4 py-3 text-right">{s.prepaidOrders}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.gmv)}</td>
                          <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(s.platformCommission)}</td>
                          <td className="px-4 py-3 text-right text-green-700">{formatCurrency(s.sellerPayout)}</td>
                          <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(s.shipperIncome)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.shippingFee)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="text-purple-600 hover:underline text-xs font-medium"
                              onClick={() => setRestaurantId(s.restaurantId)}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {restaurantId && detail && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{detail.restaurantName}</h2>
                <button
                  onClick={() => setRestaurantId('')}
                  className="text-sm text-purple-600 hover:underline"
                >
                  ← Về tất cả nhà hàng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Đơn COD</p>
                  <p className="text-xl font-bold">{detail.paymentSplit?.codOrders ?? 0}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(detail.paymentSplit?.codGmv || 0)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Đơn trả trước / ví / SePay</p>
                  <p className="text-xl font-bold">{detail.paymentSplit?.prepaidOrders ?? 0}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(detail.paymentSplit?.prepaidGmv || 0)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Chiết khấu sàn</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(sellers[0]?.platformCommission || 0)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Shipper nhận (base+km+peak)</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(sellers[0]?.shipperIncome || 0)}</p>
                  <p className="text-xs text-gray-400">
                    Base {formatCurrency(sellers[0]?.shipperBaseFee || 0)} · Km {formatCurrency(sellers[0]?.shipperDistanceFee || 0)}
                  </p>
                </Card>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Món bán trong kỳ</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Món</th>
                        <th className="px-4 py-3 font-medium text-right">Số lượng</th>
                        <th className="px-4 py-3 font-medium text-right">Số đơn</th>
                        <th className="px-4 py-3 font-medium text-right">Doanh thu món</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detail.products || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Chưa có món</td>
                        </tr>
                      ) : (
                        detail.products.map((p: any, idx: number) => (
                          <tr key={`${p.productId}-${idx}`}>
                            <td className="px-4 py-3 font-medium">{p.itemName}</td>
                            <td className="px-4 py-3 text-right">{p.quantitySold}</td>
                            <td className="px-4 py-3 text-right">{p.orderCount}</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Đơn gần đây</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Mã</th>
                        <th className="px-4 py-3 font-medium">PTTT</th>
                        <th className="px-4 py-3 font-medium text-right">Tổng</th>
                        <th className="px-4 py-3 font-medium text-right">Seller</th>
                        <th className="px-4 py-3 font-medium text-right">Sàn</th>
                        <th className="px-4 py-3 font-medium text-right">Shipper</th>
                        <th className="px-4 py-3 font-medium text-right">Phí KH</th>
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detail.recentOrders || []).map((o: any) => (
                        <tr key={o.orderId}>
                          <td className="px-4 py-3 font-mono text-xs">#{String(o.orderId).slice(0, 8)}</td>
                          <td className="px-4 py-3">{o.paymentMethod}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(o.totalAmount)}</td>
                          <td className="px-4 py-3 text-right text-green-700">{formatCurrency(o.sellerPayout)}</td>
                          <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(o.platformCommission)}</td>
                          <td className="px-4 py-3 text-right text-blue-700">
                            {formatCurrency(o.shipperIncome)}
                            <div className="text-[10px] text-gray-400">
                              {formatCurrency(o.shipperBaseFee)}+{formatCurrency(o.shipperDistanceFee)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{formatCurrency(o.shippingFee)}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
