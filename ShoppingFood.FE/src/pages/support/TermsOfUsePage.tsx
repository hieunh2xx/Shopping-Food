export function TermsOfUsePage() {
  return (
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Điều khoản sử dụng</h1>
        
        <div className="prose prose-orange max-w-none text-gray-600">
          <p className="mb-4">Chào mừng bạn đến với Shopping Food. Vui lòng đọc kỹ các điều khoản sử dụng dưới đây trước khi sử dụng dịch vụ của chúng tôi.</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">1. Chấp nhận điều khoản</h2>
          <p className="mb-4">Bằng việc truy cập và sử dụng ứng dụng Shopping Food, bạn đồng ý tuân thủ các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ.</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">2. Dịch vụ cung cấp</h2>
          <p className="mb-4">Shopping Food cung cấp nền tảng kết nối giữa khách hàng, nhà hàng và đối tác giao hàng. Chúng tôi không trực tiếp sản xuất hoặc chế biến món ăn.</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">3. Trách nhiệm người dùng</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Cung cấp thông tin chính xác khi đăng ký tài khoản.</li>
            <li>Bảo mật thông tin đăng nhập của mình.</li>
            <li>Thanh toán đầy đủ cho các đơn hàng đã đặt.</li>
            <li>Không sử dụng dịch vụ cho các mục đích bất hợp pháp.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">4. Sửa đổi điều khoản</h2>
          <p className="mb-4">Chúng tôi có quyền cập nhật hoặc thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên nền tảng.</p>
          
          <p className="mt-8 text-sm text-gray-500">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </div>
    </div>
  );
}
