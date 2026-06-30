import { FileText, Settings, ShieldAlert, Phone } from 'lucide-react';

export function HelpCenterPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trung tâm trợ giúp</h1>
          <p className="text-lg text-gray-600">Chúng tôi có thể giúp gì cho bạn?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: FileText, title: 'Hướng dẫn đặt hàng', desc: 'Cách tìm kiếm, đặt món và thanh toán' },
            { icon: Settings, title: 'Tài khoản của tôi', desc: 'Quản lý thông tin cá nhân và địa chỉ' },
            { icon: ShieldAlert, title: 'Báo cáo sự cố', desc: 'Đơn hàng bị trễ, thiếu món hoặc lỗi ứng dụng' },
            { icon: Phone, title: 'Liên hệ CSKH', desc: 'Gọi trực tiếp qua tổng đài 1900 xxxx' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <item.icon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
