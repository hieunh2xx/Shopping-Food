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
    activeOrderCount: number;
}

export interface ISendProposalRequest{
    orderId: string;
    shipperId: string;
}

export interface IForceAssignRequest{
    orderId: string;
    shipperId: string;
}

export interface IResolveIncidentRequest {
    resolutionType: 'CustomerFault' | 'ShipperFault' | 'ForceCancelNoPenalty' | 'CompensateCustomer' | 'Warning' | 'Dismiss' | 'EscalateToAdmin';
    notes: string;
    penaltyScore?: number;
}

export interface IReleaseOrderRequest {
    newShipperId?: string;
    reason: string;
}

export interface IIncidentItemDto {
    id: string;
    incidentType: string; // DeliveryFailed, OrderComplaint, ShipperComplaint
    title: string;
    description: string;
    status: string; // Pending, Resolved, Ignored
    orderId: string;
    shipperProfileId?: string;
    contactName: string;
    contactPhone?: string;
    createdAt: string;
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
  completedOrderCount: number; // Also fix this from completedOrdersCount to completedOrderCount as it's returned by API
  isLocked: boolean;
}

export interface ISuspendShipperRequest {
  durationMinutes: number;
  reason: string;
}

