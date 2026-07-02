export interface ISubmitAppealRequest {
  targetId: string;
  targetType: number;
  reason: string;
}

export interface ISubmitOrderComplaintRequest {
  orderId: string;
  reason: string;
  description?: string;
  evidenceImageUrl: string;
}

export interface ISubmitShipperComplaintRequest {
  orderId: string;
  reason: string;
  description?: string;
  evidenceImageUrl: string;
}
