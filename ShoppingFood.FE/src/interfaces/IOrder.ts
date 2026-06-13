export interface IOrderSummary {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export interface ISendCheckoutOtpRequest {
  fullName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  guestUserId?: string;
}

export interface ICheckoutRequest {
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  otpCode: string;
  paymentMethod: 'COD' | 'CreditCard' | 'EWallet';
  note?: string;
  guestUserId?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
}

export interface IUpdateOrderRequest {
  orderId: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  note?: string;
  guestUserId?: string;
}

export interface ICancelOrderRequest {
  orderId: string;
  guestUserId?: string;
}

export interface IReorderRequest {
  orderId: string;
}

export interface IAcceptOrderRequest {
  orderId: string;
}

export interface IRejectOrderRequest {
  orderId: string;
  rejectReason: string;
}

export interface IPrepareOrderRequest {
  orderId: string;
}

export interface IWaitingShipperOrderRequest {
  orderId: string;
}

export interface ISellerCancelOrderRequest {
  orderId: string;
  reason: string;
}
