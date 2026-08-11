import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../components/common/Button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  /** Chỉ 1 nút — thay cho window.alert */
  hideCancel?: boolean;
}

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver({ resolve });
    });
  };

  const alert = async (opts: AlertOptions): Promise<void> => {
    await confirm({
      title: opts.title ?? 'Thông báo',
      message: opts.message,
      confirmText: opts.confirmText ?? 'Đã hiểu',
      hideCancel: true,
    });
  };

  const handleConfirm = () => {
    if (resolver) resolver.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) resolver.resolve(false);
    setIsOpen(false);
  };

  const isAlert = !!options?.hideCancel;

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}

      {isOpen && options && createPortal(
        // z-index phải cao hơn Modal (z-[10000]) để hiện trên modal thanh toán
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-4 ${
                options.isDanger ? 'bg-red-100' : isAlert ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                {isAlert ? (
                  <Info className={`w-6 h-6 ${options.isDanger ? 'text-red-600' : 'text-blue-600'}`} />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${options.isDanger ? 'text-red-600' : 'text-orange-600'}`} />
                )}
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                {options.title || (isAlert ? 'Thông báo' : 'Xác nhận hệ thống')}
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6 whitespace-pre-line">
                {options.message}
              </p>

              <div className={`flex gap-3 w-full ${isAlert ? 'justify-center' : ''}`}>
                {!isAlert && (
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
                  className={isAlert ? 'min-w-[140px]' : 'flex-1'}
                  onClick={handleConfirm}
                >
                  {options.confirmText || (isAlert ? 'Đã hiểu' : 'Đồng ý')}
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
