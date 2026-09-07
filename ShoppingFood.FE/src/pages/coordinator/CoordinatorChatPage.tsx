import { SupportChatDashboard } from '../../components/chat/SupportChatDashboard';

/**
 * Trang Quản Lý Live Chat Điều Phối Viên (CoordinatorChatPage).
 * Cho phép nhân viên điều phối (Coordinator) tiếp nhận và trao đổi trực tiếp với khách hàng/tài xế.
 */
export function CoordinatorChatPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Live Chat</h1>
        <p className="text-gray-500">Tiếp nhận và xử lý tin nhắn trực tiếp từ khách hàng</p>
      </div>
      <SupportChatDashboard role="Coordinator" />
    </div>
  );
}

