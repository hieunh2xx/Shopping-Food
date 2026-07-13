import type { IProductDto } from './IProduct';

export interface IFavoriteRestaurantDto {
  restaurantId: string;
  restaurantName: string;
  logoUrl?: string;
  address: string;
  favoritedAt: string;
}

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
  isFavorite?: boolean;
  isVerified?: boolean;
  openingTime?: string;
  closingTime?: string;
  deliveryType?: 'PlatformDelivery' | 'SelfDelivery';
  maxDeliveryRadiusKm?: number;
  freeDeliveryRadiusKm?: number;
  freeShippingMinimumOrder?: number;
  shippingFee: number;
  products: IProductDto[];
}

export interface INearbyRestaurantDto {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  logoUrl?: string;
  latitude?: number;
  longitude?: number;
  averageRating: number;
  reviewCount: number;
  openingTime?: string;
  closingTime?: string;
  maxDeliveryRadius?: number;
  shippingFee: number;
  distanceKm: number;
  isVerified?: boolean;
}

export interface IUpdateRestaurantBasicInfo {
  restaurantName: string;
  phone: string;
  address: string;
  logoUrl?: string;
  bannerUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface IUpdateRestaurantOperatingHours {
  openingTime: string;
  closingTime: string;
}

export interface IUpdateRestaurantStatus {
  isTemporarilyClosed: boolean;
}

export interface IUpdateRestaurantDeliveryConfig {
  deliveryType: 'PlatformDelivery' | 'SelfDelivery';
  maxDeliveryRadiusKm?: number;
  freeDeliveryRadiusKm: number;
  freeShippingMinimumOrder: number;
  shippingFee: number;
}
