import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse } from '../interfaces/IApiResponse';

export interface IPaymentMethod {
  code: string;
  name: string;
  description: string;
  requiresAuth: boolean;
  icon: string;
}

export interface IWalletDto {
  id: string;
  balance: number;
  availableBalance?: number;
  ownerType: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  codCollectedAmount?: number;
  codPayableAmount?: number;
  pendingCodRemittance?: number;
  availableCodToRemit?: number;
  debtLimit?: number;
  debtRemaining?: number;
  walletDebt?: number;
  sellerMaintenanceFee?: number;
  nextMaintenanceDueAt?: string;
  lastMaintenanceFeeChargedAt?: string;
}

export interface ITransactionDto {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export interface ITransactionsPageDto {
  items: ITransactionDto[];
  totalCount: number;
  skip: number;
  take: number;
  dailyChart: { date: string; income: number; expense: number; net: number }[];
}

/**
 * Dịch vụ Thanh toán & Quản lý Ví điện tử (PaymentService).
 * Cung cấp toàn bộ các chức năng tài chính:
 * - Phương thức thanh toán, nạp tiền vào ví, rút tiền về tài khoản ngân hàng
 * - Thanh toán chuyển khoản tự động SePay (VietQR) và kiểm tra trạng thái giao dịch
 * - Quản lý công nợ COD của tài xế (thu hộ, nộp tiền COD, hạn mức nợ)
 * - Doanh thu đối tác người bán (Seller) và tài xế (Shipper)
 * - Đối soát tài chính và xuất hóa đơn điện tử
 */
class PaymentService {
  /**
   * Lấy danh sách các phương thức thanh toán khả dụng trên hệ thống (COD, Ví, Thẻ, SePay QR).
   */
  async getPaymentMethods(): Promise<IApiResponse<{ methods: IPaymentMethod[]; eWalletProviders: { code: string; name: string }[]; commissionRate: number }>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.METHODS);
  }

  /**
   * Lấy thông tin ví điện tử của người dùng/đối tác (số dư, số dư khả dụng, công nợ COD, thông tin ngân hàng).
   * @param params - Loại chủ sở hữu ví (Customer, Seller, Shipper) hoặc restaurantId
   */
  async getWallet(params?: { ownerType?: string; restaurantId?: string }): Promise<IApiResponse<IWalletDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WALLET, { params });
  }

  /**
   * Tạo phiên nạp tiền vào ví điện tử thông qua cổng thanh toán SePay QR.
   * @param amount - Số tiền nạp (VNĐ)
   */
  async topUpWallet(amount: number): Promise<IApiResponse<{ sessionId: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.TOP_UP, { amount });
  }

  /**
   * Xác nhận hoàn tất thanh toán cho một phiên giao dịch ví.
   * @param sessionId - Mã phiên thanh toán
   */
  async confirmPayment(sessionId: string): Promise<IApiResponse<null>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.CONFIRM, { sessionId });
  }

  /**
   * Tạo yêu cầu rút tiền từ số dư ví về tài khoản ngân hàng cá nhân.
   * @param data - Số tiền rút và thông tin tài khoản ngân hàng thụ hưởng
   */
  async requestWithdrawal(data: { amount: number; bankName: string; bankAccountNumber: string; bankAccountHolder: string }): Promise<IApiResponse<{ withdrawalId: string; status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.WITHDRAW, data);
  }

  /**
   * Lấy danh sách lịch sử biến động số dư và giao dịch ví (có phân trang, lọc theo loại và ngày).
   * @param params - Bộ lọc giao dịch
   */
  async getTransactions(params?: {
    skip?: number;
    take?: number;
    fromDate?: string;
    toDate?: string;
    type?: string;
    codOnly?: boolean;
    excludeCod?: boolean;
  }): Promise<IApiResponse<ITransactionsPageDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.TRANSACTIONS, { params });
  }

  /**
   * Phê duyệt hoặc từ chối yêu cầu rút tiền của đối tác (dành cho Admin/Kế toán).
   * @param data - Mã rút tiền, quyết định duyệt và ảnh bill chuyển khoản
   */
  async approveWithdrawal(data: { withdrawalId: string; approve: boolean; rejectReason?: string; transferProofImageUrl?: string }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.APPROVE_WITHDRAWAL, data);
  }

  /**
   * Người dùng xác nhận đã nhận được tiền về tài khoản ngân hàng thành công.
   * @param data - Mã rút tiền và trạng thái đã nhận
   */
  async confirmWithdrawal(data: { withdrawalId: string; isReceived: boolean }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.CONFIRM_WITHDRAWAL, data);
  }

  /**
   * Admin ép buộc hoàn tất yêu cầu rút tiền (trong trường hợp đối tác quên xác nhận).
   * @param data - Mã yêu cầu rút tiền
   */
  async forceCompleteWithdrawal(data: { withdrawalId: string }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.FORCE_COMPLETE_WITHDRAWAL, data);
  }

  /**
   * Tải lên hình ảnh hóa đơn / ủy nhiệm chi ngân hàng làm bằng chứng chuyển khoản rút tiền.
   * @param file - File ảnh hóa đơn
   */
  async uploadWithdrawalProof(file: File): Promise<IApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('File', file);
    return httpClient.post(API_ENDPOINTS.PAYMENT.UPLOAD_PROOF, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Lấy danh sách các yêu cầu rút tiền trong hệ thống theo trạng thái (Pending, Approved, Completed, Disputed).
   * @param status - Trạng thái rút tiền
   */
  async getWithdrawals(status?: string): Promise<IApiResponse<any[]>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WITHDRAWALS, { params: { status } });
  }

  /**
   * Gửi yêu cầu xuất hóa đơn giá trị gia tăng (VAT) cho đơn hàng.
   * @param data - Thông tin doanh nghiệp và mã số thuế
   */
  async requestInvoice(data: { orderId: string; taxCode: string; companyName: string; companyAddress: string; email: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.INVOICE, data);
  }

  /**
   * Tài xế thanh toán trả nợ công nợ ví quá hạn cho hệ thống.
   * @param amount - Số tiền trả nợ
   * @param data - Ghi chú và ảnh bằng chứng
   */
  async repayShipperDebt(amount: number, data?: { note?: string; proofImageUrl?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.REPAY_DEBT, { amount, ...data });
  }

  /**
   * Tài xế gửi yêu cầu nộp tiền COD thu hộ về tài khoản công ty.
   * @param data - Số tiền nộp COD và ảnh bill
   */
  async requestCodRemittance(data: { amount: number; note?: string; proofImageUrl?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.COD_REMITTANCE, data);
  }

  /**
   * Lấy danh sách các đợt nộp tiền COD của tài xế theo trạng thái xét duyệt.
   */
  async getCodRemittances(status?: string): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.COD_REMITTANCES, { params: { status } });
  }

  /**
   * Kế toán / Admin duyệt đơn nộp tiền COD của tài xế.
   * @param data - Mã nộp COD và kết quả duyệt
   */
  async reviewCodRemittance(data: { remittanceId: string; approve: boolean; rejectReason?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.REVIEW_COD_REMITTANCE, data);
  }

  /**
   * Cập nhật hạn mức nợ COD tối đa cho phép của một tài xế.
   * @param shipperProfileId - Mã hồ sơ tài xế
   * @param debtLimit - Hạn mức công nợ mới (VNĐ)
   */
  async updateShipperDebtLimit(shipperProfileId: string, debtLimit: number): Promise<IApiResponse<any>> {
    return httpClient.put(API_ENDPOINTS.PAYMENT.DEBT_LIMIT, { shipperProfileId, debtLimit });
  }

  /**
   * Lấy báo cáo đối soát tài chính thu chi toàn hệ thống trong khoảng thời gian.
   */
  async getReconciliation(params?: { fromDate?: string; toDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.RECONCILIATION, { params });
  }

  /**
   * Lấy tổng quan tình hình thu hộ COD toàn sàn (Tổng tiền COD đang giữ, chưa nộp, đã nộp).
   */
  async getCodOverview(): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.COD_OVERVIEW);
  }

  /**
   * Lấy thống kê doanh thu và hoa hồng của Người bán hàng.
   */
  async getSellerRevenues(params?: { fromDate?: string; toDate?: string; restaurantId?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SELLER_REVENUES, { params });
  }

  /**
   * Lấy thống kê thu nhập giao hàng và phí ship của Tài xế.
   */
  async getShipperRevenues(params?: { fromDate?: string; toDate?: string; shipperId?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SHIPPER_REVENUES, { params });
  }

  /**
   * Lấy thông tin phiên thanh toán SePay Checkout (URL thanh toán và trường dữ liệu).
   * @param sessionId - Mã phiên thanh toán
   * @param paymentMethod - Phương thức thanh toán
   */
  async getSepayCheckout(sessionId: string, paymentMethod?: string): Promise<IApiResponse<ISepayCheckoutDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_CHECKOUT(sessionId), {
      params: paymentMethod ? { paymentMethod } : undefined,
    });
  }

  /**
   * Lấy mã QR chuyển khoản ngân hàng SePay (VietQR) và thông tin tài khoản đích.
   * @param sessionId - Mã phiên thanh toán
   */
  async getSepayQr(sessionId: string): Promise<IApiResponse<ISepayQrDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_QR(sessionId));
  }

  /**
   * Kiểm tra trạng thái hiện tại của phiên thanh toán SePay (đã thanh toán, đang chờ, hết hạn).
   * @param params - Mã phiên (sessionId) hoặc mã hóa đơn (invoiceNumber)
   */
  async getPaymentSessionStatus(params: { sessionId?: string; invoiceNumber?: string }): Promise<IApiResponse<IPaymentSessionStatusDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_STATUS, { params });
  }

  /**
   * Kích hoạt đối soát thanh toán SePay thủ công với ngân hàng (nếu webhook bị chậm).
   * @param params - Mã phiên hoặc số hóa đơn
   */
  async reconcileSepayPayment(params: { sessionId?: string; invoiceNumber?: string }): Promise<IApiResponse<ISepayReconcileResult>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.SEPAY_RECONCILE, null, { params });
  }

  /**
   * Hủy bỏ phiên thanh toán SePay chưa thanh toán khi người dùng thoát hoặc hủy giao dịch.
   * @param sessionId - Mã phiên thanh toán
   */
  async abandonUnpaidSepay(sessionId: string): Promise<IApiResponse<{
    abandoned: boolean;
    alreadyPaid: boolean;
    sessionId: string;
    orderId?: string;
    status?: string;
  }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.SEPAY_ABANDON, { sessionId });
  }

  /**
   * Lấy lịch sử tất cả các phiên thanh toán của người dùng (có phân trang).
   */
  async getPaymentHistory(params?: { skip?: number; take?: number }): Promise<IApiResponse<{ total: number; items: IPaymentHistoryItem[] }>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.HISTORY, { params });
  }

  /**
   * Lấy dữ liệu biểu đồ và số liệu tổng hợp cho trang Dashboard Thanh toán (Admin).
   */
  async getPaymentDashboard(params?: { fromDate?: string; toDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.DASHBOARD, { params });
  }
}

export interface ISepayCheckoutDto {
  sessionId: string;
  invoiceNumber: string;
  amount: number;
  checkoutUrl: string;
  method: string;
  fields: Record<string, string>;
}

export interface IPaymentSessionStatusDto {
  paymentId: string;
  sessionId: string;
  invoiceNumber: string;
  transferContent?: string;
  amount: number;
  itemsSubtotal?: number;
  shippingFee?: number;
  status: string;
  displayStatus?: string;
  statusLabel?: string;
  orderId?: string;
  paymentMethod: string;
  isPaid: boolean;
  awaitingWebhook?: boolean;
  isProcessing?: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  remainingSeconds?: number;
  qrImageUrl?: string;
  externalTransactionId?: string;
  message?: string;
}

export interface ISepayQrDto {
  paymentId: string;
  sessionId: string;
  invoiceNumber: string;
  transferContent?: string;
  amount: number;
  itemsSubtotal?: number;
  shippingFee?: number;
  status: string;
  displayStatus?: string;
  statusLabel?: string;
  qrImageUrl: string;
  bankName?: string;
  bankAccountNumber?: string;
  accountHolder?: string;
  expiresAt: string;
  remainingSeconds: number;
  isExpired: boolean;
  isPaid: boolean;
  awaitingWebhook?: boolean;
  isProcessing?: boolean;
  orderId?: string;
}

export interface ISepayReconcileResult {
  success: boolean;
  alreadyPaid: boolean;
  matchedOnSepay: boolean;
  skippedCooldown?: boolean;
  externalTransactionId?: string;
  message: string;
}

export interface IPaymentHistoryItem {
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  displayStatus?: string;
  statusLabel?: string;
  paymentMethod: string;
  orderId?: string;
  createdAt: string;
  expiresAt: string;
  externalTransactionId?: string;
  isPaid: boolean;
}

export const paymentService = new PaymentService();
