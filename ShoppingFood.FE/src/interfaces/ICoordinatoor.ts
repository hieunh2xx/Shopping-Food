export interface IDispatchOrderItem{
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface IDispatchOrder{
    id: string;
    status: string;
    totalAmount: number;
    shippingFee: number;
    deliveryAddress: string;
    contactName: string;
    contactPhone: string;
    note?: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
    restaurantName: string;
    restaurantAddress: string;
    shipperId?: string;
    shipperName: string;
    shipperPhone: string;
    items: IDispatchOrderItem[];
}

export interface ISuggestedShipper{
    shipperId: string;
    fullName: string;
    phone: string;
    vehicleType: string;
    vehiclePlateNumber: string;
    latitude?: number;
    longitude?: number;
    distanceInKm: number;
    reputationScore: number;
    rating: number;
}

export interface ISendProposalRequest{
    orderId: string;
    shipperId: string;
}

export interface IForceAssignRequest{
    orderId: string;
    shipperId: string;
}

export interface IResolveIncidentRequest{
    resolutionType: 'CustomerFault' | 'ShipperFault' | 'ForceCancelNoPenalty';
    notes: string;
    penaltyScore?: number;
}

export interface IReleaseOrderRequest{
    newShipperId?: string;
    reason: string;
}

export interface IMonitorShipperDto {
  shipperId: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  vehiclePlateNumber: string;
  latitude?: number;
  longitude?: number;
  isOnline: boolean;
  status: string;
  reputationScore: number;
  rating: number;
  isBusy: boolean;
  completedOrdersCount: number;
}

export interface ISuspendShipperRequest {
  durationMinutes: number;
  reason: string;
}

