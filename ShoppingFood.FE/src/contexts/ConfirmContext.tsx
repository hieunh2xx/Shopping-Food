import { createContext, useContext, useState, type ReactNode } from 'react';
import { Button } from '../components/common';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
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

  const handleConfirm = () => {
    if (resolver) resolver.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) resolver.resolve(false);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {isOpen && options && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                {options.title || 'Xác nhận hệ thống'}
              </h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                {options.message}
              </p>
              
              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleCancel}
                >
                  {options.cancelText || 'Hủy'}
                </Button>
                <Button 
                  variant={options.isDanger ? 'danger' : 'primary'}
                  className="flex-1" 
                  onClick={handleConfirm}
                >
                  {options.confirmText || 'Đồng ý'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
