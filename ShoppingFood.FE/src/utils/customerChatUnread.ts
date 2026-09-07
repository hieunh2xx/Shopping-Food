const STORAGE_KEY = 'customer_chat_unread';
const READ_EVENT = 'customer_chat_read_updated';

/** Bản đồ lưu số lượng tin nhắn chưa đọc theo từng phiên chat (sessionId -> số tin chưa đọc) */
export type CustomerChatUnreadMap = Record<string, number>;

/**
 * Đọc bản đồ số lượng tin nhắn chưa đọc từ LocalStorage.
 * @returns Object CustomerChatUnreadMap
 */
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

/**
 * Ghi bản đồ số lượng tin nhắn chưa đọc vào LocalStorage và phát sự kiện window event để cập nhật UI realtime.
 * @param map - Đối tượng bản đồ tin nhắn chưa đọc
 */
function writeMap(map: CustomerChatUnreadMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(READ_EVENT));
}

/**
 * Lấy danh sách mốc thời gian đọc tin nhắn gần nhất của từng phiên chat (sessionId → ISO timestamp).
 * @returns Bản đồ mốc thời gian đọc
 */
export function getCustomerChatLastReadMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem('customer_chat_last_read');
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Cập nhật mốc thời gian đọc tin nhắn mới nhất cho một phiên chat cụ thể.
 * @param sessionId - Mã định danh phiên chat
 * @param at - Thời gian đọc ISO (mặc định là thời gian hiện tại)
 */
export function setCustomerChatLastRead(sessionId: string, at = new Date().toISOString()) {
  const map = getCustomerChatLastReadMap();
  map[sessionId] = at;
  localStorage.setItem('customer_chat_last_read', JSON.stringify(map));
}

/**
 * Lấy toàn bộ bản đồ số lượng tin nhắn chưa đọc hiện tại của khách hàng.
 * @returns Bản đồ sessionId -> số lượng tin chưa đọc
 */
export function getCustomerUnreadMap(): CustomerChatUnreadMap {
  return readMap();
}

/**
 * Tính tổng số lượng tin nhắn chưa đọc của tất cả các phiên chat.
 * @returns Tổng số tin nhắn chưa đọc
 */
export function getCustomerTotalUnread(): number {
  return Object.values(readMap()).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

/**
 * Đánh dấu đã đọc cho một phiên chat (và các phiên chat liên quan), xóa số đếm chưa đọc và cập nhật timestamp.
 * @param sessionId - Mã phiên chat chính
 * @param relatedSessionIds - Danh sách các mã phiên chat liên quan cần đánh dấu đã đọc
 */
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

/**
 * Tăng số lượng tin nhắn chưa đọc cho một phiên chat cụ thể khi nhận được tin nhắn mới từ người bán.
 * @param sessionId - Mã phiên chat
 * @param by - Số lượng tin nhắn tăng thêm (mặc định là 1)
 */
export function incrementCustomerSessionUnread(sessionId: string, by = 1) {
  if (!sessionId || by <= 0) return;
  const map = readMap();
  map[sessionId] = (Number(map[sessionId]) || 0) + by;
  writeMap(map);
}

/**
 * Đồng bộ trạng thái chưa đọc từ danh sách phiên chat trả về từ API backend với bộ nhớ cục bộ.
 * @param sessions - Danh sách phiên chat từ API
 * @returns Tổng số tin nhắn chưa đọc sau khi đồng bộ
 */
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

/** Tên sự kiện phát đi khi trạng thái đọc tin nhắn thay đổi */
export const CUSTOMER_CHAT_READ_EVENT = READ_EVENT;
