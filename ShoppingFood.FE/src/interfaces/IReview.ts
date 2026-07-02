export interface IProductReviewDto {
  id: string;
  productId: string;
  productName: string;
  userProfileId: string;
  userName: string;
  avatarUrl: string | null;
  rating: number;
  comment: string | null;
  sellerReply: string | null;
  createdAt: string | null;
}
