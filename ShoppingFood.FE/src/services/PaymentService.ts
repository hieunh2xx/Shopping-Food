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
}

export const paymentService = new PaymentService();
