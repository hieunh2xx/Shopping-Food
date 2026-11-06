import type { IGroupOrderForOrderDto } from '../interfaces';

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Strip the "[P.A305·Minh] " prefix the backend adds to order item names for group orders. */
export function stripPortionPrefix(itemName: string) {
  return itemName.replace(/^\[[^\]]*\]\s*/, '');
}

/** One sticker per portion so the kitchen can bag each student's food separately. */
export function printGroupPortionLabels(info: IGroupOrderForOrderDto, restaurantName?: string) {
  const short = info.orderId.substring(0, 8).toUpperCase();
  const labels = info.portions.map((p) => {
    const items = p.items.map((i) => {
      const extras = [i.selectedSize, i.selectedToppings].filter(Boolean).join(', ');
      return `<li><b>${i.quantity}×</b> ${escapeHtml(i.itemName)}${extras ? `<div class="extras">${escapeHtml(extras)}</div>` : ''}${i.note ? `<div class="note">${escapeHtml(i.note)}</div>` : ''}</li>`;
    }).join('');
    return `
    <section class="label">
      <div class="top"><span>${escapeHtml(restaurantName || 'UniEats')}</span><span>#${short} · Gom #${escapeHtml(info.code)}</span></div>
      <div class="portion">PHẦN ${p.index}/${info.portionCount}</div>
      <div class="room">${p.roomNumber ? `Phòng ${escapeHtml(p.roomNumber)}` : escapeHtml(info.buildingDropPoint || info.buildingName)}</div>
      <div class="who">${escapeHtml(p.displayName)}</div>
      <div class="building">${escapeHtml(info.buildingName)}</div>
      <ul>${items}</ul>
      ${p.note ? `<div class="note">Ghi chú: ${escapeHtml(p.note)}</div>` : ''}
    </section>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Tem gom đơn #${escapeHtml(info.code)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #111; margin: 0; padding: 12px; }
    .label { max-width: 320px; margin: 0 auto 14px; padding: 12px 14px; border: 2px dashed #f97316; border-radius: 10px; page-break-after: always; }
    .label:last-child { page-break-after: auto; }
    .top { display: flex; justify-content: space-between; font-size: 11px; color: #555; }
    .portion { margin-top: 6px; font-size: 13px; font-weight: 800; color: #c2410c; letter-spacing: 0.08em; }
    .room { font-size: 30px; font-weight: 900; line-height: 1.1; margin-top: 2px; }
    .who { font-size: 16px; font-weight: 700; }
    .building { font-size: 12px; color: #555; margin-bottom: 6px; }
    ul { margin: 6px 0 0; padding-left: 16px; font-size: 13px; }
    li { margin-bottom: 4px; }
    .extras { font-size: 11px; color: #555; }
    .note { font-size: 11px; color: #c2410c; }
    @media print { body { padding: 0; } .label { margin: 0; max-width: none; } }
  </style>
</head>
<body>
  ${labels}
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=420,height=720');
  if (!w) {
    alert('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
