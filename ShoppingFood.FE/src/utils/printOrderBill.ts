/**
 * Print kitchen/customer bill(s) for seller orders.
 * Each order is a separate printable page so batch printing still yields one bill per order.
 */

export interface OrderBillItem {
  itemName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  selectedSize?: string | null;
  selectedToppings?: string | null;
  isGift?: boolean;
}

export interface OrderBillData {
  id: string;
  contactName?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  note?: string | null;
  status?: string;
  paymentMethod?: string;
  itemsSubtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  tierDiscountAmount?: number;
  discountCode?: string;
  totalAmount?: number;
  createdAt?: string;
  items?: OrderBillItem[];
  shipperName?: string | null;
  batchPickupCode?: string | null;
}

function formatMoney(n: number | undefined | null) {
  return `${(n ?? 0).toLocaleString('vi-VN')} đ`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderOrderBillHtml(order: OrderBillData, restaurantName?: string, index?: number, total?: number) {
  const short = order.id.substring(0, 8).toUpperCase();
  const otp = order.id.slice(-6).toUpperCase();
  const items = order.items || [];
  const bagLabel = total && total > 1 ? `Túi ${index! + 1}/${total}` : '';

  const rows = items
    .map((item) => {
      const isGift = !!item.isGift || String(item.itemName || '').startsWith('[Tặng]');
      const name = String(item.itemName || '').replace(/^\[Tặng\]\s*/, '');
      const extras = [item.selectedSize, item.selectedToppings].filter(Boolean).join(', ');
      const lineTotal = isGift ? 0 : (item.totalPrice ?? (item.unitPrice || 0) * (item.quantity || 0));
      return `
        <tr>
          <td>
            <div class="item-name">${escapeHtml(name)}${isGift ? ' <span class="gift">Tặng</span>' : ''}</div>
            ${extras ? `<div class="extras">${escapeHtml(extras)}</div>` : ''}
          </td>
          <td class="qty">x${item.quantity || 0}</td>
          <td class="money">${formatMoney(lineTotal)}</td>
        </tr>`;
    })
    .join('');

  return `
    <section class="bill">
      <header>
        <div class="store">${escapeHtml(restaurantName || 'Shopping Food')}</div>
        <div class="title">PHIẾU ĐƠN HÀNG</div>
        ${bagLabel ? `<div class="bag">${escapeHtml(bagLabel)}</div>` : ''}
      </header>

      <div class="meta">
        <div><strong>Mã đơn:</strong> #${short}</div>
        <div><strong>OTP đơn:</strong> ${otp}</div>
        ${order.batchPickupCode ? `<div><strong>Mã lô gộp:</strong> ${escapeHtml(order.batchPickupCode)}</div>` : ''}
        <div><strong>Thời gian:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—'}</div>
        <div><strong>TT:</strong> ${escapeHtml(order.status || '—')} · ${escapeHtml(order.paymentMethod || '')}</div>
      </div>

      <div class="customer">
        <div><strong>Khách:</strong> ${escapeHtml(order.contactName || '—')}</div>
        <div><strong>SĐT:</strong> ${escapeHtml(order.contactPhone || '—')}</div>
        <div><strong>Giao:</strong> ${escapeHtml(order.deliveryAddress || '—')}</div>
        ${order.shipperName ? `<div><strong>Shipper:</strong> ${escapeHtml(order.shipperName)}</div>` : ''}
        ${order.note ? `<div class="note"><strong>Ghi chú:</strong> ${escapeHtml(String(order.note))}</div>` : ''}
      </div>

      <table>
        <thead>
          <tr><th>Món</th><th>SL</th><th>Tiền</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="3">Không có món</td></tr>'}</tbody>
      </table>

      <div class="totals">
        <div><span>Tiền món</span><span>${formatMoney(order.itemsSubtotal ?? Math.max(0, (order.totalAmount || 0) - (order.shippingFee || 0)))}</span></div>
        ${order.discountAmount ? `<div><span>Giảm giá${order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ''}</span><span>-${formatMoney(order.discountAmount)}</span></div>` : ''}
        ${order.tierDiscountAmount ? `<div><span>Chiết khấu điểm hạng</span><span>-${formatMoney(order.tierDiscountAmount)}</span></div>` : ''}
        <div><span>Phí giao</span><span>${formatMoney(order.shippingFee)}</span></div>
        <div class="grand"><span>Tổng</span><span>${formatMoney(order.totalAmount)}</span></div>
      </div>

      <footer>Dán phiếu này lên túi · đối chiếu #${short}</footer>
    </section>`;
}

export function printSellerOrderBills(
  orders: OrderBillData[],
  options?: { restaurantName?: string; title?: string }
) {
  if (!orders.length) return;

  const billsHtml = orders
    .map((o, i) => renderOrderBillHtml(o, options?.restaurantName, i, orders.length))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options?.title || 'In bill đơn hàng')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111; margin: 0; padding: 12px; }
    .bill { max-width: 360px; margin: 0 auto 16px; padding: 12px 14px; border: 1px solid #ddd; page-break-after: always; }
    .bill:last-child { page-break-after: auto; }
    header { text-align: center; margin-bottom: 10px; }
    .store { font-size: 14px; font-weight: 700; }
    .title { font-size: 16px; font-weight: 800; letter-spacing: 0.04em; margin-top: 2px; }
    .bag { margin-top: 4px; font-size: 12px; font-weight: 700; color: #c2410c; }
    .meta, .customer { font-size: 12px; line-height: 1.45; margin-bottom: 10px; }
    .note { color: #c2410c; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; border-bottom: 1px solid #333; padding: 4px 0; font-size: 11px; }
    td { padding: 6px 0; border-bottom: 1px dashed #ddd; vertical-align: top; }
    .qty { width: 36px; text-align: center; }
    .money { width: 88px; text-align: right; white-space: nowrap; }
    .item-name { font-weight: 600; }
    .extras { font-size: 11px; color: #555; }
    .gift { font-size: 10px; color: #047857; font-weight: 700; }
    .totals { margin-top: 10px; font-size: 12px; }
    .totals > div { display: flex; justify-content: space-between; padding: 2px 0; }
    .grand { font-size: 14px; font-weight: 800; border-top: 1px solid #333; margin-top: 4px; padding-top: 6px !important; }
    footer { margin-top: 12px; text-align: center; font-size: 11px; color: #666; }
    @media print {
      body { padding: 0; }
      .bill { border: none; margin: 0; max-width: none; }
    }
  </style>
</head>
<body>
  ${billsHtml}
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'noopener,noreferrer,width=480,height=720');
  if (!w) {
    alert('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
