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
  latitude: number;
  longitude: number;
}

export interface IConfirmArrivedRequest {
  orderId: string;
  latitude: number;
  longitude: number;
}

export interface IConfirmPickedUpRequest {
  orderId: string;
  verificationCode: string;
  latitude: number;
  longitude: number;
}

export interface IUpdateShipperLocationRequest {
  latitude: number;
  longitude: number;
}

export interface IConfirmDeliverySuccessRequest{
  orderId: string;
  latitude: number;
  longitude: number;
  deliveryProofImageUrl?: string;
}

export interface IConfirmDeliveryFailedRequest {
  orderId: string;
  reason: string;
  latitude: number;
  longitude: number;
}

export interface IDailyIncomeReportDto {
  date: string;
  completedOrdersCount: number;
  shippingFees: number;
  bonus: number;
  totalIncome: number;
}

export interface IShipperIncomeReportDto {
  completedOrdersCount: number;
  totalShippingFees: number;
  totalBonuses: number;
  totalIncome: number;
  dailyReports: IDailyIncomeReportDto[];
}

export interface IWorkingScheduleItemDto{
  dayOfWeek: number;
  from: string;
  to: string;
}

export interface IShipperScheduleAndAreaDto{
  operatingLatitude: number | null;
  operatingLongitude: number | null;
  operatingRadiusKm: number | null;
  workingSchedule: IWorkingScheduleItemDto[];
}

export interface IUpdateShipperScheduleAndAreaRequest{
  operatingLatitude?: number;
  operatingLongitude?: number;
  operatingRadiusKm?: number;
  workingSchedule: IWorkingScheduleItemDto[];
}