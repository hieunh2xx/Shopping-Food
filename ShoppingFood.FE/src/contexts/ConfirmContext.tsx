import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/common/Button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  /** Chỉ 1 nút Đóng — dùng thay toast lỗi / thông báo */
  hideCancel?: boolean;
}

interface ModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Hiển thị modal thông báo 1 nút (thay alert/toast lỗi) */
  showModal: (options: ModalOptions) => Promise<void>;
  /** @deprecated Dùng showModal */
  alert: (options: ModalOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

let modalNotifier: ((opts: ModalOptions) => Promise<void>) | null = null;

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

function resolveToastMessage(message: unknown): string {
  if (typeof message === 'string') return message;
  if (typeof message === 'function') {
    try {
      const result = (message as (t: unknown) => unknown)(toast);
      return typeof result === 'string' ? result : String(result ?? '');
    } catch {
      return 'Đã xảy ra lỗi';
    }
  }
  if (message == null) return 'Đã xảy ra lỗi';
  return String(message);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = { resolve };
    });
  }, []);

  const showModal = useCallback(async (opts: ModalOptions): Promise<void> => {
    await confirm({
      title: opts.title ?? 'Thông báo',
      message: opts.message,
      confirmText: opts.confirmText ?? 'Đã hiểu',
      isDanger: opts.isDanger,
      hideCancel: true,
    });
  }, [confirm]);

  useEffect(() => {
    modalNotifier = showModal;
    const originalError = toast.error.bind(toast);

    (toast as any).error = (message: unknown, opts?: { id?: string }) => {
      if (opts?.id) toast.dismiss(opts.id);
      const text = resolveToastMessage(message).trim() || 'Đã xảy ra lỗi';
      void modalNotifier?.({
        title: 'Thông báo',
        message: text,
        isDanger: true,
        confirmText: 'Đã hiểu',
      });
      return opts?.id ?? '';
    };

    return () => {
      modalNotifier = null;
      (toast as any).error = originalError;
    };
  }, [showModal]);

  const handleConfirm = () => {
    resolverRef.current?.resolve(true);
    resolverRef.current = null;
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolverRef.current?.resolve(false);
    resolverRef.current = null;
    setIsOpen(false);
  };

  const isInfoModal = !!options?.hideCancel;

  return (
    <ConfirmContext.Provider value={{ confirm, showModal, alert: showModal }}>
      {children}

      {isOpen && options && createPortal(
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 ${
                options.isDanger ? 'bg-red-100' : isInfoModal ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                {isInfoModal ? (
                  <Info className={`w-6 h-6 ${options.isDanger ? 'text-red-600' : 'text-blue-600'}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${options.isDanger ? 'text-red-600' : 'text-orange-600'}`} />
                )}
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                {options.title || (isInfoModal ? 'Thông báo' : 'Xác nhận')}
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6 whitespace-pre-line">
                {options.message}
              </p>

              <div className={`flex gap-3 w-full ${isInfoModal ? 'justify-center' : ''}`}>
                {!isInfoModal && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    {options.cancelText || 'Hủy'}
                  </Button>
                )}
                <Button
                  variant={options.isDanger ? 'danger' : 'primary'}
                  className={isInfoModal ? 'min-w-[140px]' : 'flex-1'}
                  onClick={handleConfirm}
                >
                  {options.confirmText || (isInfoModal ? 'Đã hiểu' : 'Đồng ý')}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
}
