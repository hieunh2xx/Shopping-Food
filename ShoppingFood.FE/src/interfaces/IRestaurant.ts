import type { IProductDto } from './IProduct';

export interface IRestaurantProfileDto {
  id: string;
  restaurantName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  products: IProductDto[];
}

export interface IUpdateRestaurantBasicInfo {
  restaurantName: string;
  phone: string;
  logoUrl?: string;
  bannerUrl?: string;
  latitude: number;
  longitude: number;
}

export interface IUpdateRestaurantOperatingHours {
  openingTime: string;
  closingTime: string;
}

export interface IUpdateRestaurantStatus {
  isTemporarilyClosed: boolean;
}

export interface IUpdateRestaurantDeliveryRadius {
  maxDeliveryRadiusKm: number;
}

export interface IUpdateRestaurantShippingFee {
  shippingFee: number;
}
