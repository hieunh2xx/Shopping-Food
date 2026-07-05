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

export interface ICreateSupportTicketRequest {
  orderId: string;
  customerId?: string;
  reason: string;
  description?: string;
  evidenceImageUrl?: string;
}
