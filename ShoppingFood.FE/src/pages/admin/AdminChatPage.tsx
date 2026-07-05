import { SupportChatDashboard } from '../../components/chat/SupportChatDashboard';

export function AdminChatPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Live Chat</h1>
        <p className="text-gray-500">Tiếp nhận và xử lý tin nhắn trực tiếp từ khách hàng</p>
      </div>
      <SupportChatDashboard />
    </div>
  );
}
