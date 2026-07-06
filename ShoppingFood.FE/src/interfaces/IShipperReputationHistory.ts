export interface IShipperReputationHistory {
  id: string;
  orderId?: string;
  pointChange: number;
  reason: string;
  createdAt: string;
}
