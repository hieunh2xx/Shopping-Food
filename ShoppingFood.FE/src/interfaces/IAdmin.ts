/**
 * Mirrors backend ApproveApplicationCommand
 */
/**
 * Mirrors backend ApproveApplicationCommand
 */
export interface IApproveApplicationRequest {
  applicationId: string;
  action?: string;
  isApproved?: boolean;
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

export interface IRevenueChartPoint {
  date: string;
  /** Doanh thu sàn (tương thích field cũ) */
  revenue: number;
  gmv: number;
  platformRevenue: number;
  sellerPayout: number;
  shipperIncome: number;
  ordersCount: number;
}

export interface IAdminDashboardStats {
  /** GMV trong kỳ */
  grossMerchandiseValue: number;
  /** Doanh thu sàn = tổng PlatformCommission trong kỳ */
  totalRevenue: number;
  /** Tổng cần trả seller trong kỳ */
  totalSellerPayout: number;
  /** Tổng thu nhập shipper trong kỳ */
  totalShipperIncome: number;
  /** VAT ước tính trên doanh thu sàn */
  estimatedTax: number;
  /** Doanh thu sàn sau VAT ước tính */
  netPlatformRevenue: number;
  totalOrders: number;
  activeUsers: number;
  periodDays: number;
  revenueChartData: IRevenueChartPoint[];
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
}
