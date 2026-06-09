export interface IDeliveryRouteDto {
  orderId: string;
  shipperLatitude?: number;
  shipperLongitude?: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLatitude?: number;
  restaurantLongitude?: number;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerLatitude?: number;
  customerLongitude?: number;
  googleMapNavigationUrl: string;
}

export interface IProposedDeliveryOfferDto {
  orderId: string;
  totalAmount: number;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  note?: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantLatitude?: number;
  restaurantLongitude?: number;
  distanceInKm: number;
  shippingFee: number;
  countdownSeconds: number;
}

export interface IToggleShipperOnlineRequest {
  isOnline: boolean;
}

export interface IAcceptDeliveryOfferRequest {
  orderId: string;
}

export interface IConfirmArrivedRequest {
  orderId: string;
}

export interface IConfirmPickedUpRequest {
  orderId: string;
}

export interface IUpdateShipperLocationRequest {
  latitude: number;
  longitude: number;
}
