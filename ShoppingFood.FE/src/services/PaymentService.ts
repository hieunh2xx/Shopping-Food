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
  ownerType: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  codCollectedAmount?: number;
  debtLimit?: number;
  debtRemaining?: number;
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

class PaymentService {
  async getPaymentMethods(): Promise<IApiResponse<{ methods: IPaymentMethod[]; eWalletProviders: { code: string; name: string }[]; commissionRate: number }>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.METHODS);
  }

  async getWallet(params?: { ownerType?: string; restaurantId?: string }): Promise<IApiResponse<IWalletDto>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WALLET, { params });
  }

  async topUpWallet(amount: number): Promise<IApiResponse<{ balance: number }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.TOP_UP, { amount });
  }

  async confirmPayment(sessionId: string): Promise<IApiResponse<null>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.CONFIRM, { sessionId });
  }

  async requestWithdrawal(data: { amount: number; bankName: string; bankAccountNumber: string; bankAccountHolder: string }): Promise<IApiResponse<{ withdrawalId: string; status: string }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.WITHDRAW, data);
  }

  async getTransactions(params?: { skip?: number; take?: number }): Promise<IApiResponse<ITransactionDto[]>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.TRANSACTIONS, { params });
  }

  async getWithdrawals(status?: string): Promise<IApiResponse<any[]>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.WITHDRAWALS, { params: { status } });
  }

  async approveWithdrawal(withdrawalId: string, approve: boolean, rejectReason?: string): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.APPROVE_WITHDRAWAL, { withdrawalId, approve, rejectReason });
  }

  async requestInvoice(data: { orderId: string; taxCode: string; companyName: string; companyAddress: string; email: string }): Promise<IApiResponse<any>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.INVOICE, data);
  }

  async repayShipperDebt(amount: number): Promise<IApiResponse<{ repaid: number; remainingDebt: number }>> {
    return httpClient.post(API_ENDPOINTS.PAYMENT.REPAY_DEBT, { amount });
  }

  async updateShipperDebtLimit(shipperProfileId: string, debtLimit: number): Promise<IApiResponse<any>> {
    return httpClient.put(API_ENDPOINTS.PAYMENT.DEBT_LIMIT, { shipperProfileId, debtLimit });
  }

  async getReconciliation(params?: { fromDate?: string; toDate?: string }): Promise<IApiResponse<any>> {
    return httpClient.get(API_ENDPOINTS.PAYMENT.RECONCILIATION, { params });
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
  status: string;
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

export interface IPaymentHistoryItem {
  paymentId: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paymentMethod: string;
  orderId?: string;
  createdAt: string;
  expiresAt: string;
  externalTransactionId?: string;
  isPaid: boolean;
}

export const paymentService = new PaymentService();
