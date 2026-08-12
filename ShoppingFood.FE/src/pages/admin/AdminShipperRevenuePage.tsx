import { useCallback, useEffect, useState } from 'react';
import { Truck, TrendingUp, DollarSign, Info, CreditCard, MapPin } from 'lucide-react';
import { Card } from '../../components/common';
import { paymentService } from '../../services/PaymentService';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

type PeriodDays = 7 | 30;

export function AdminShipperRevenuePage() {
  const [days, setDays] = useState<PeriodDays>(30);
  const [shipperId, setShipperId] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - (days - 1));
      const res = await paymentService.getShipperRevenues({
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        shipperId: shipperId || undefined,
      });
      if (!res.error) setData(res.data);
      else toast.error(res.message);
    } finally {
      setLoading(false);
    }
  }, [days, shipperId]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const shipperRevenues = data?.shipperRevenues || [];
  const shippers = data?.shippers || [];
  const detail = data?.detail;
  const formula = data?.incomeFormula;
  const selectedRow = shipperRevenues[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doanh thu theo shipper</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thu nhập từng tài xế · base / km / peak · COD / trả trước · theo quán
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={shipperId}
            onChange={(e) => setShipperId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-[220px]"
          >
            <option value="">Tất cả shipper</option>
            {shippers.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.phone ? ` · ${s.phone}` : ''}
              </option>
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
              <p className="font-semibold text-blue-900">Công thức thu nhập shipper</p>
              <p>{formula.note}</p>
              <p><strong>Shipper nhận:</strong> {formula.shipperIncome}</p>
              <p>
                Hiện tại: Base <strong>{formatCurrency(formula.shipperBaseFee || 0)}</strong>
                {' '}+ max(0, km−{formula.freeDistanceKmForShipper}) × <strong>{formatCurrency(formula.shipperFeePerKm || 0)}</strong>/km
              </p>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {[
              { label: 'Shipper', value: summary?.shipperCount ?? 0, icon: Truck },
              { label: 'Tổng đơn', value: summary?.totalOrders ?? 0, icon: TrendingUp },
              { label: 'COD', value: summary?.totalCodOrders ?? 0, icon: CreditCard },
              { label: 'Trả trước', value: summary?.totalPrepaidOrders ?? 0, icon: CreditCard },
              { label: 'Tổng thu nhập', value: formatCurrency(summary?.totalIncome || 0), icon: DollarSign },
              { label: 'Base fee', value: formatCurrency(summary?.totalBaseFee || 0), icon: DollarSign },
              { label: 'Phí km', value: formatCurrency(summary?.totalDistanceFee || 0), icon: MapPin },
              { label: 'Peak bonus', value: formatCurrency(summary?.totalPeakBonus || 0), icon: TrendingUp },
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

          {!shipperId && (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Shipper</th>
                      <th className="px-4 py-3 font-medium text-right">Đơn</th>
                      <th className="px-4 py-3 font-medium text-right">COD</th>
                      <th className="px-4 py-3 font-medium text-right">Trả trước</th>
                      <th className="px-4 py-3 font-medium text-right">Thu nhập</th>
                      <th className="px-4 py-3 font-medium text-right">Base</th>
                      <th className="px-4 py-3 font-medium text-right">Km</th>
                      <th className="px-4 py-3 font-medium text-right">Peak</th>
                      <th className="px-4 py-3 font-medium text-right">TB/đơn</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {shipperRevenues.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                          Chưa có đơn Delivered có shipper trong kỳ
                        </td>
                      </tr>
                    ) : (
                      shipperRevenues.map((s: any) => (
                        <tr key={s.shipperId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{s.shipperName}</p>
                            {s.shipperPhone && (
                              <p className="text-xs text-gray-400">{s.shipperPhone}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">{s.orderCount}</td>
                          <td className="px-4 py-3 text-right">{s.codOrders}</td>
                          <td className="px-4 py-3 text-right">{s.prepaidOrders}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(s.totalIncome)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.baseFee)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.distanceFee)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.peakBonus)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(s.avgIncomePerOrder)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="text-purple-600 hover:underline text-xs font-medium"
                              onClick={() => setShipperId(s.shipperId)}
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

          {shipperId && detail && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{detail.shipperName}</h2>
                  {detail.shipperPhone && (
                    <p className="text-sm text-gray-500">{detail.shipperPhone}</p>
                  )}
                </div>
                <button
                  onClick={() => setShipperId('')}
                  className="text-sm text-purple-600 hover:underline"
                >
                  ← Về tất cả shipper
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Thu nhập kỳ</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedRow?.totalIncome || 0)}</p>
                  <p className="text-xs text-gray-400">{selectedRow?.orderCount || 0} đơn</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Đơn COD</p>
                  <p className="text-xl font-bold">{detail.paymentSplit?.codOrders ?? 0}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(detail.paymentSplit?.codIncome || 0)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Đơn trả trước</p>
                  <p className="text-xl font-bold">{detail.paymentSplit?.prepaidOrders ?? 0}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(detail.paymentSplit?.prepaidIncome || 0)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500">Base · Km · Peak</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedRow?.baseFee || 0)} · {formatCurrency(selectedRow?.distanceFee || 0)} · {formatCurrency(selectedRow?.peakBonus || 0)}
                  </p>
                </Card>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Theo nhà hàng lấy hàng</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Nhà hàng</th>
                        <th className="px-4 py-3 font-medium text-right">Đơn</th>
                        <th className="px-4 py-3 font-medium text-right">Thu nhập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detail.byRestaurant || []).map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">{r.restaurantName}</td>
                          <td className="px-4 py-3 text-right">{r.orderCount}</td>
                          <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(r.income)}</td>
                        </tr>
                      ))}
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
                        <th className="px-4 py-3 font-medium">Thời gian</th>
                        <th className="px-4 py-3 font-medium">Quán</th>
                        <th className="px-4 py-3 font-medium">PTTT</th>
                        <th className="px-4 py-3 font-medium text-right">Thu nhập</th>
                        <th className="px-4 py-3 font-medium text-right">Base</th>
                        <th className="px-4 py-3 font-medium text-right">Km</th>
                        <th className="px-4 py-3 font-medium text-right">Peak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(detail.recentOrders || []).map((o: any) => (
                        <tr key={o.orderId}>
                          <td className="px-4 py-3 font-mono text-xs">#{String(o.orderId).slice(0, 8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—'}
                          </td>
                          <td className="px-4 py-3">{o.restaurantName}</td>
                          <td className="px-4 py-3">{o.paymentMethod}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCurrency(o.shipperIncome)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(o.shipperBaseFee)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(o.shipperDistanceFee)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(o.shipperPeakBonus)}</td>
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
