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

class PaymentService {
  async getPaymentMethods(): Promise<IApiResponse<{ methods: IPaymentMethod[]; eWalletProviders: { code: string; name: string }[]; commissionRate: number }>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.METHODS);
  }

  async getWallet(params?: { ownerType?: string; restaurantId?: string }): Promise<IApiResponse<IWalletDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WALLET, { params });
  }

  async topUpWallet(amount: number): Promise<IApiResponse<{ sessionId: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.TOP_UP, { amount });
  }

  async confirmPayment(sessionId: string): Promise<IApiResponse<null>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.CONFIRM, { sessionId });
  }

  async requestWithdrawal(data: { amount: number; bankName: string; bankAccountNumber: string; bankAccountHolder: string }): Promise<IApiResponse<{ withdrawalId: string; status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.WITHDRAW, data);
  }

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

  async approveWithdrawal(data: { withdrawalId: string; approve: boolean; rejectReason?: string; transferProofImageUrl?: string }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.APPROVE_WITHDRAWAL, data);
  }

  async confirmWithdrawal(data: { withdrawalId: string; isReceived: boolean }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.CONFIRM_WITHDRAWAL, data);
  }

  async forceCompleteWithdrawal(data: { withdrawalId: string }): Promise<IApiResponse<{ status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.FORCE_COMPLETE_WITHDRAWAL, data);
  }

  async uploadWithdrawalProof(file: File): Promise<IApiResponse<{ imageUrl: string }>> {
    const formData = new FormData();
    formData.append('File', file);
    return httpClient.post(API_ENDPOINTS.PAYMENT.UPLOAD_PROOF, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getWithdrawals(status?: string): Promise<IApiResponse<any[]>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WITHDRAWALS, { params: { status } });
  }


  async requestInvoice(data: { orderId: string; taxCode: string; companyName: string; companyAddress: string; email: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.INVOICE, data);
  }

  async repayShipperDebt(amount: number, data?: { note?: string; proofImageUrl?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.REPAY_DEBT, { amount, ...data });
  }

  async requestCodRemittance(data: { amount: number; note?: string; proofImageUrl?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.COD_REMITTANCE, data);
  }

  async getCodRemittances(status?: string): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.COD_REMITTANCES, { params: { status } });
  }

  async reviewCodRemittance(data: { remittanceId: string; approve: boolean; rejectReason?: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.REVIEW_COD_REMITTANCE, data);
  }

  async updateShipperDebtLimit(shipperProfileId: string, debtLimit: number): Promise<IApiResponse<any>> {
    return httpClient.put(API_ENDPOINTS.PAYMENT.DEBT_LIMIT, { shipperProfileId, debtLimit });
  }

  async getReconciliation(params?: { fromDate?: string; toDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.RECONCILIATION, { params });
  }

  async getCodOverview(): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.COD_OVERVIEW);
  }

  async getSellerRevenues(params?: { fromDate?: string; toDate?: string; restaurantId?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SELLER_REVENUES, { params });
  }

  async getShipperRevenues(params?: { fromDate?: string; toDate?: string; shipperId?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SHIPPER_REVENUES, { params });
  }

  async getSepayCheckout(sessionId: string, paymentMethod?: string): Promise<IApiResponse<ISepayCheckoutDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_CHECKOUT(sessionId), {
      params: paymentMethod ? { paymentMethod } : undefined,
    });
  }

  async getSepayQr(sessionId: string): Promise<IApiResponse<ISepayQrDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_QR(sessionId));
  }

  async getPaymentSessionStatus(params: { sessionId?: string; invoiceNumber?: string }): Promise<IApiResponse<IPaymentSessionStatusDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.SEPAY_STATUS, { params });
  }

  async reconcileSepayPayment(params: { sessionId?: string; invoiceNumber?: string }): Promise<IApiResponse<ISepayReconcileResult>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.SEPAY_RECONCILE, null, { params });
  }

  async abandonUnpaidSepay(sessionId: string): Promise<IApiResponse<{
    abandoned: boolean;
    alreadyPaid: boolean;
    sessionId: string;
    orderId?: string;
    status?: string;
  }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.SEPAY_ABANDON, { sessionId });
  }

  async getPaymentHistory(params?: { skip?: number; take?: number }): Promise<IApiResponse<{ total: number; items: IPaymentHistoryItem[] }>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.HISTORY, { params });
  }

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
  discountAmount?: number;
  tierDiscountAmount?: number;
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
  discountAmount?: number;
  tierDiscountAmount?: number;
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
