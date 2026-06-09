export interface IToppingDto {
  id: string;
  restaurantId: string;
  toppingName: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface ICreateToppingRequest {
  restaurantId: string;
  toppingName: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface IUpdateToppingRequest {
  id: string;
  restaurantId: string;
  toppingName: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
}
