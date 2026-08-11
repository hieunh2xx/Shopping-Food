const STORAGE_KEY = 'customer_chat_unread';
const READ_EVENT = 'customer_chat_read_updated';

export type CustomerChatUnreadMap = Record<string, number>;

function readMap(): CustomerChatUnreadMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CustomerChatUnreadMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: CustomerChatUnreadMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(READ_EVENT));
}

/** Legacy last-read timestamps (sessionId → ISO). */
export function getCustomerChatLastReadMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem('customer_chat_last_read');
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function setCustomerChatLastRead(sessionId: string, at = new Date().toISOString()) {
  const map = getCustomerChatLastReadMap();
  map[sessionId] = at;
  localStorage.setItem('customer_chat_last_read', JSON.stringify(map));
}

export function getCustomerUnreadMap(): CustomerChatUnreadMap {
  return readMap();
}

export function getCustomerTotalUnread(): number {
  return Object.values(readMap()).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export function markCustomerSessionRead(sessionId: string, relatedSessionIds: string[] = []) {
  const ids = Array.from(new Set([sessionId, ...relatedSessionIds]));
  const map = readMap();
  let changed = false;
  for (const id of ids) {
    if (map[id]) {
      delete map[id];
      changed = true;
    }
    setCustomerChatLastRead(id);
  }
  if (changed || ids.length > 0) {
    writeMap(map);
  } else {
    window.dispatchEvent(new Event(READ_EVENT));
  }
}

export function incrementCustomerSessionUnread(sessionId: string, by = 1) {
  if (!sessionId || by <= 0) return;
  const map = readMap();
  map[sessionId] = (Number(map[sessionId]) || 0) + by;
  writeMap(map);
}

/** Sync unread from API list: unread thread with no local count → at least 1. */
export function syncCustomerUnreadFromSessions(
  sessions: Array<{
    id: string;
    relatedSessionIds?: string[];
    lastMessageAt?: string;
    lastSenderRole?: string;
  }>
) {
  const map = readMap();
  const lastRead = getCustomerChatLastReadMap();
  let changed = false;

  for (const s of sessions) {
    const ids = [s.id, ...(s.relatedSessionIds || [])];
    const existing = ids.reduce((sum, id) => sum + (Number(map[id]) || 0), 0);

    const fromStore =
      s.lastSenderRole === 'Seller' || s.lastSenderRole === 'Mall';

    if (!s.lastMessageAt || !fromStore) {
      continue;
    }

    const msgDateStr = String(s.lastMessageAt);
    const msgDate = msgDateStr.endsWith('Z') ? new Date(msgDateStr) : new Date(msgDateStr + 'Z');
    const readAt = lastRead[s.id] || ids.map((id) => lastRead[id]).filter(Boolean).sort().pop();
    const isUnread = !readAt || msgDate > new Date(readAt);

    if (isUnread && existing === 0) {
      map[s.id] = 1;
      changed = true;
    } else if (!isUnread && existing > 0) {
      for (const id of ids) delete map[id];
      changed = true;
    }
  }

  if (changed) writeMap(map);
  return getCustomerTotalUnread();
}

export const CUSTOMER_CHAT_READ_EVENT = READ_EVENT;
