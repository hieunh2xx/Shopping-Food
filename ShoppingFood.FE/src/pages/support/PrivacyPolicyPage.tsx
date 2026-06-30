export function PrivacyPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chính sách bảo mật</h1>
        
        <div className="prose prose-orange max-w-none text-gray-600">
          <p className="mb-4">Bảo mật thông tin của khách hàng là ưu tiên hàng đầu của Shopping Food. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu cá nhân của bạn.</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Thông tin thu thập</h2>
          <p className="mb-4">Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, đặt hàng hoặc tham gia các chương trình khuyến mãi. Các thông tin này bao gồm: họ tên, số điện thoại, địa chỉ giao hàng, và địa chỉ email.</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Mục đích sử dụng</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Xử lý và giao đơn hàng của bạn.</li>
            <li>Cung cấp thông tin về trạng thái đơn hàng.</li>
            <li>Cải thiện chất lượng dịch vụ và cá nhân hóa trải nghiệm.</li>
            <li>Gửi các thông báo về khuyến mãi (nếu bạn đồng ý).</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">3. Chia sẻ thông tin</h2>
          <p className="mb-4">Chúng tôi chỉ chia sẻ thông tin giao hàng của bạn (Tên, Số điện thoại, Địa chỉ) cho nhà hàng và đối tác tài xế nhằm mục đích thực hiện đơn hàng. Chúng tôi cam kết không bán dữ liệu của bạn cho bên thứ ba.</p>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">4. Bảo mật dữ liệu</h2>
          <p className="mb-4">Shopping Food áp dụng các biện pháp bảo mật nghiêm ngặt để bảo vệ dữ liệu của bạn khỏi các truy cập trái phép hoặc rò rỉ thông tin.</p>
          
          <p className="mt-8 text-sm text-gray-500">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    </div>
  );
}
