import React from 'react';
import { Hammer } from 'lucide-react';
import { Button } from '../../components/common';

const MaintenancePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Hammer className="w-12 h-12 text-orange-500 animate-bounce" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Hệ Thống Đang Bảo Trì
          </h1>
          <p className="text-gray-500 text-base">
            Chúng tôi đang nâng cấp hệ thống để mang lại trải nghiệm tốt hơn. Quá trình này có thể mất một chút thời gian.
          </p>
          <p className="text-gray-500 text-sm font-medium">
            Vui lòng quay lại sau. Chúng tôi xin lỗi vì sự bất tiện này!
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full text-lg py-3 rounded-2xl"
          >
            Thử Tải Lại Trang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
