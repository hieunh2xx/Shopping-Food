import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { Modal, Button } from '../../../components/common';

export interface BatchPickupOrderItem {
  orderId: string;
  contactName?: string;
  /** Chỉ các đơn đã đến quán mới cho phép chọn; các đơn vừa nhận sẽ bị vô hiệu hóa */
  canSelect: boolean;
}

interface BatchPickupCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderIds: string[], code: string) => void;
  orders: BatchPickupOrderItem[];
  restaurantName?: string;
  isLoading?: boolean;
}

/**
 * Modal Nhập Mã Lấy Hàng Hàng Loạt Tại Quán (BatchPickupCodeModal).
 * Cho phép tài xế ghép nhiều đơn cùng quán nhập 1 mã OTP 6 ký tự để nhận tất cả các món ăn cùng lúc.
 */
export function BatchPickupCodeModal({
  isOpen,
  onClose,
  onConfirm,
  orders,
  restaurantName,
  isLoading = false,
}: BatchPickupCodeModalProps) {

  const selectableIds = orders.filter((o) => o.canSelect).map((o) => o.orderId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([...selectableIds]);
      setCode(Array(6).fill(''));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orders.map((o) => `${o.orderId}:${o.canSelect}`).join('|')]);

  const toggleOrder = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1).toUpperCase();
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
      } else {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!pastedData) return;
    const newCode = [...code];
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6 || selectedIds.length === 0) return;
    onConfirm(selectedIds, fullCode);
  };

  const bagCount = orders.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lấy nhiều đơn cùng quán" size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="text-center space-y-1">
          <p className="text-gray-700 text-sm font-medium">
            {restaurantName ? restaurantName : 'Nhà hàng'} — {bagCount} đơn đang giao
          </p>
          <p className="text-gray-500 text-xs">
            Chỉ xác nhận đơn đã tick. Kiểm tra đủ túi trước khi gửi. Đơn bỏ tick giữ lại lấy sau.
          </p>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50">
          {orders.map((order) => {
            const checked = selectedIds.includes(order.orderId);
            return (
              <label
                key={order.orderId}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  order.canSelect ? 'cursor-pointer hover:bg-white' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-orange-500"
                  checked={checked}
                  disabled={!order.canSelect || isLoading}
                  onChange={() => order.canSelect && toggleOrder(order.orderId)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    #{order.orderId.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {order.contactName || 'Khách'}
                    {!order.canSelect ? ' — chưa xác nhận đến quán' : ''}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div>
          <p className="text-center text-sm text-gray-600 mb-3">
            Nhập <span className="font-semibold text-orange-600">mã lấy hàng gộp</span> từ nhà hàng
          </p>
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all disabled:opacity-50 disabled:bg-gray-50 uppercase"
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={code.join('').length !== 6 || selectedIds.length === 0 || isLoading}
            isLoading={isLoading}
          >
            Xác nhận {selectedIds.length} đơn
          </Button>
        </div>
      </form>
    </Modal>
  );
}
