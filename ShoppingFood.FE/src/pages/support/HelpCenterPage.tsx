import { useState, useEffect } from 'react';
import { FileText, Settings, ShieldAlert, Phone, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';
import { faqService } from '../../services';
import type { IFaqDto } from '../../interfaces';
import { Loading } from '../../components/common';

export function HelpCenterPage() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<IFaqDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await faqService.getList(); // User chỉ xem được IsActive = true
        if (!res.error && res.data) {
          setFaqs(res.data);
        }
      } catch {
        // Silent error
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trung tâm trợ giúp</h1>
          <p className="text-lg text-gray-600">Chúng tôi có thể giúp gì cho bạn?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to={ROUTES.PROFILE} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Tài khoản của tôi</h3>
              <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân</p>
            </div>
          </Link>

          <Link to={ROUTES.REPORT_INCIDENT} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Báo cáo sự cố</h3>
              <p className="text-sm text-gray-500 mt-1">Báo lỗi từ đơn hàng</p>
            </div>
          </Link>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.dispatchEvent(new Event('openLiveChat'))}>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Liên hệ CSKH</h3>
              <p className="text-sm text-gray-500 mt-1">Chat trực tuyến với hỗ trợ</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Câu hỏi thường gặp</h2>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loading size="md" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Chưa có câu hỏi thường gặp nào.
            </div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => {
                const isExpanded = expandedIds.has(faq.id);
                return (
                  <div key={faq.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 transition-colors">
                    <button
                      className="w-full flex items-center justify-between p-5 text-left bg-white focus:outline-none"
                      onClick={() => toggleExpand(faq.id)}
                    >
                      <div className="flex items-center gap-4">
                        <HelpCircle className="w-5 h-5 text-orange-400 shrink-0" />
                        <span className="font-medium text-gray-900 text-lg">{faq.question}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-5 pt-0 pl-[3.25rem] bg-white">
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
