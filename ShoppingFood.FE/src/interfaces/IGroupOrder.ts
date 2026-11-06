/**
 * Mirrors backend ShoppingFood.Dto.GroupOrders (campus map + gom đơn nội khu)
 */
export type CampusBuildingType = 'Dormitory' | 'Lecture' | 'Gate' | 'Landmark';
export type GroupDeliveryMode = 'Gate' | 'Lobby' | 'Room';
export type GroupPaymentMode = 'Individual' | 'HostPaysAll';
export type GroupOrderStatus = 'Open' | 'Submitted' | 'Cancelled';
export type GroupMemberPaymentStatus = 'Unpaid' | 'Paid' | 'Refunded';

export interface ICampusBuildingDto {
  id: string;
  campusId: string;
  code: string;
  name: string;
  shortName: string;
  buildingType: CampusBuildingType;
  zone?: string | null;
  description?: string | null;
  dropPoint?: string | null;
  floors: number;
  allowRoomDelivery: boolean;
  mapX: number;
  mapY: number;
  mapWidth: number;
  mapHeight: number;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  sortOrder: number;
  openGroupCount: number;
}

export interface ICampusDto {
  id: string;
  code: string;
  name: string;
  shortName: string;
  address: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  minGroupMembers: number;
  maxGroupMembers: number;
  groupBaseShippingFee: number;
  lobbySurchargePerMember: number;
  roomSurchargePerMember: number;
  singleRoomDeliveryFee: number;
  isActive: boolean;
  sortOrder: number;
  openGroupCount: number;
  buildings: ICampusBuildingDto[];
}

export type IUpsertCampusRequest = Omit<ICampusDto, 'id' | 'openGroupCount' | 'buildings'>;
export type IUpsertCampusBuildingRequest = Omit<ICampusBuildingDto, 'id' | 'campusId' | 'openGroupCount'>;

export interface IGroupOrderSummaryDto {
  id: string;
  code: string;
  title: string;
  status: GroupOrderStatus;
  deliveryMode: GroupDeliveryMode;
  paymentMode: GroupPaymentMode;
  campusId: string;
  campusShortName: string;
  buildingId: string;
  buildingName: string;
  buildingShortName: string;
  restaurantId: string;
  restaurantName: string;
  restaurantLogoUrl?: string | null;
  hostName: string;
  memberCount: number;
  minMembers: number;
  maxMembers: number;
  shippingSharePerMember: number;
  surchargePerMember: number;
  expiresAt: string;
  createdAt: string;
  orderId?: string | null;
  orderStatus?: string | null;
  isMember: boolean;
}

export interface IGroupOrderItemDto {
  id: string;
  productId: string;
  itemName: string;
  imageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedSize?: string | null;
  selectedToppings?: string | null;
  note?: string | null;
}

export interface IGroupOrderMemberDto {
  id: string;
  userAccountId: string;
  displayName: string;
  avatarUrl?: string | null;
  phone?: string | null;
  roomNumber?: string | null;
  note?: string | null;
  isHost: boolean;
  isMe: boolean;
  itemsSubtotal: number;
  shippingShare: number;
  amountDue: number;
  prepayAmount: number;
  paidAmount: number;
  paymentStatus: GroupMemberPaymentStatus;
  paidByUserId?: string | null;
  paidByName?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  joinedAt: string;
  items: IGroupOrderItemDto[];
}

/** Từng phần ăn của đơn gom — nhà hàng đóng gói / shipper giao theo phòng. */
export interface IGroupOrderPortionDto {
  memberId: string;
  index: number;
  displayName: string;
  phone?: string | null;
  roomNumber?: string | null;
  note?: string | null;
  isHost: boolean;
  itemsSubtotal: number;
  deliveredAt?: string | null;
  items: IGroupOrderItemDto[];
}

export interface IGroupOrderForOrderDto {
  orderId: string;
  groupOrderId: string;
  code: string;
  title: string;
  deliveryMode: GroupDeliveryMode;
  campusName: string;
  buildingName: string;
  buildingDropPoint?: string | null;
  floors: number;
  note?: string | null;
  portionCount: number;
  deliveredCount: number;
  shippingFeeTotal: number;
  shipperIncome: number;
  itemsSubtotal: number;
  isPrepaid: boolean;
  orderStatus?: string | null;
  canMarkDelivered: boolean;
  portions: IGroupOrderPortionDto[];
}

export interface IGroupOrderDetailDto extends IGroupOrderSummaryDto {
  campusName: string;
  buildingDropPoint?: string | null;
  buildingAllowRoomDelivery: boolean;
  hostUserId: string;
  note?: string | null;
  cancelReason?: string | null;
  baseShippingFee: number;
  singleRoomDeliveryFee: number;
  itemsSubtotal: number;
  shippingFeeTotal: number;
  shipperIncome: number;
  totalAmount: number;
  prepayShippingShare: number;
  activeMemberCount: number;
  paidMemberCount: number;
  isHost: boolean;
  canSubmit: boolean;
  submitBlockReason?: string | null;
  restaurantIsOpen: boolean;
  submittedAt?: string | null;
  myMemberId?: string | null;
  members: IGroupOrderMemberDto[];
}

export interface IGroupOrderMenuItemDto {
  id: string;
  itemName: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryName?: string | null;
  isAvailable: boolean;
  sizes: { sizeName: string; extraPrice: number; isDefault: boolean }[];
  toppings: { name: string; price: number; isAvailable: boolean }[];
}

export interface IGroupOrderRestaurantDto {
  id: string;
  restaurantName: string;
  address: string;
  logoUrl?: string | null;
  averageRating: number;
  isOpen: boolean;
  distanceKm?: number | null;
  openGroupCount: number;
}

export interface ICreateGroupOrderRequest {
  campusId: string;
  buildingId: string;
  restaurantId: string;
  title: string;
  deliveryMode: GroupDeliveryMode;
  paymentMode: GroupPaymentMode;
  roomNumber?: string;
  phone?: string;
  note?: string;
  durationMinutes: number;
  /** Món của trưởng nhóm — bắt buộc có ít nhất 1 món (hoặc fromCart). */
  items?: IAddGroupOrderItemRequest[];
  /** Chuyển món của quán này trong giỏ hàng sang phòng gom. */
  fromCart?: boolean;
}

export interface IJoinGroupOrderRequest {
  roomNumber?: string;
  phone?: string;
  note?: string;
  items?: IAddGroupOrderItemRequest[];
  fromCart?: boolean;
}

export interface IAddGroupOrderItemRequest {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedToppings?: string[];
  note?: string;
}

/** Món đang chọn ở FE trước khi tạo / vào phòng. */
export interface IGroupOrderDraftItem extends IAddGroupOrderItemRequest {
  key: string;
  itemName: string;
  unitPrice: number;
}
