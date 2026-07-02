export interface ISystemReportDto {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string | null;
  targetType: string;
  title: string;
  content: string | null;
  status: string;
  createdAt: string;
}

export interface IGetReviewReportsParams {
  skip?: number;
  take?: number;
}

export interface IModerateReviewRequest {
  action: number; // 0=Dismiss, 1=DeleteReview, 2=WarnUser
}
