import { useState, useRef, KeyboardEvent, ClipboardEvent, useEffect } from 'react';
import { Modal, Button } from '../../../components/common';

interface PickupCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
  isLoading?: boolean;
}

export function PickupCodeModal({ isOpen, onClose, onConfirm, isLoading = false }: PickupCodeModalProps) {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCode(Array(6).fill(''));
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    // Only allow alphanumeric
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1).toUpperCase(); // Get last char and uppercase
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!code[index] && index > 0) {
        // Move focus to previous input if current is empty
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

    // Focus on the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    onConfirm(fullCode);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nhập mã đơn hàng" size="sm">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm">
            Vui lòng nhập mã xác nhận của Mã Đơn Hàng (nhận từ Nhà hàng) để xác nhận đã lấy đồ ăn.
          </p>
        </div>

        <div className="flex justify-between gap-2 mb-8">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all disabled:opacity-50 disabled:bg-gray-50 uppercase"
            />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={code.join('').length !== 6 || isLoading}
            isLoading={isLoading}
          >
            Xác nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
}
