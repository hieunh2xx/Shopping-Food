import { useCallback, useEffect, useMemo, useState } from 'react';
import { groupOrderService } from '../../services/GroupOrderService';
import type { IGroupOrderForOrderDto } from '../../interfaces';

/**
 * Loads gom-đơn info for a set of order ids (restaurant / shipper screens).
 * Orders that are not group orders are simply absent from the map.
 */
export function useGroupOrdersForOrders(orderIds: string[], pollMs?: number) {
  const [byOrderId, setByOrderId] = useState<Record<string, IGroupOrderForOrderDto>>({});
  const key = useMemo(() => [...new Set(orderIds.filter(Boolean))].sort().join(','), [orderIds]);

  const refresh = useCallback(() => {
    if (!key) return;
    groupOrderService.getForOrders(key.split(','))
      .then((res) => {
        const next: Record<string, IGroupOrderForOrderDto> = {};
        (res.data ?? []).forEach((g) => { next[g.orderId] = g; });
        setByOrderId(next);
      })
      .catch(() => { /* non-group screens still work without this info */ });
  }, [key]);

  useEffect(() => {
    refresh();
    if (!pollMs || !key) return;
    const timer = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(timer);
  }, [refresh, pollMs, key]);

  const update = useCallback((info: IGroupOrderForOrderDto) => {
    setByOrderId((prev) => ({ ...prev, [info.orderId]: info }));
  }, []);

  return { byOrderId, refresh, update };
}
