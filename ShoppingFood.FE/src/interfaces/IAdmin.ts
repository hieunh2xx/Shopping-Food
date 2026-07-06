/**
 * Mirrors backend ApproveApplicationCommand
 */
/**
 * Mirrors backend ApproveApplicationCommand
 */
export interface IApproveApplicationRequest {
  applicationId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

/**
 * Mirrors backend ApproveProductCommand
 */
export interface IApproveProductRequest {
  productId: string;
  isApproved: boolean;
  rejectionReason?: string;
}

export interface IAdminDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeUsers: number;
  revenueChartData: Array<{
    date: string;
    revenue: number;
    ordersCount: number;
  }>;
  newCustomers: number;
  customerGrowthRate: number;
  newShippers: number;
  shipperGrowthRate: number;
  newRestaurants: number;
  restaurantGrowthRate: number;
}

export interface IHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

export interface ICreateSupportTicketRequest {
  orderId: string;
  customerId?: string;
  reason: string;
  description?: string;
  evidenceImageUrl?: string;
}
