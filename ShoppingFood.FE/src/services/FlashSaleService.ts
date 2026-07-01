import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { IApiResponse } from '../interfaces';

export interface IFlashSale {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  status: string;
}

export interface IFlashSaleProduct {
  id: string;
  flashSaleId: string;
  productId: string;
  productName?: string;
  originalPrice: number;
  flashSalePrice: number;
  stockQuantity: number;
  soldQuantity: number;
  status: string;
  rejectReason?: string;
}

export interface IReviewFlashSaleProductRequest {
  flashSaleProductId: string;
  isApproved: boolean;
  rejectReason?: string;
}

export interface IRegisterFlashSaleRequest {
  flashSaleId: string;
  productId: string;
  flashSalePrice: number;
  stockQuantity: number;
}

export interface ICreateFlashSaleRequest {
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface IUpdateFlashSaleRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  status?: string;
}

class FlashSaleService {
  public async getActiveFlashSales(): Promise<IApiResponse<IFlashSale[]>> {
    return httpClient.get<IApiResponse<IFlashSale[]>>(API_ENDPOINTS.FLASH_SALE.ACTIVE);
  }

  public async getAllFlashSales(): Promise<IApiResponse<IFlashSale[]>> {
    return httpClient.get<IApiResponse<IFlashSale[]>>(API_ENDPOINTS.FLASH_SALE.ALL);
  }

  public async createFlashSale(data: ICreateFlashSaleRequest): Promise<IApiResponse<IFlashSale>> {
    return httpClient.post<IApiResponse<IFlashSale>>(API_ENDPOINTS.FLASH_SALE.CREATE, data);
  }

  public async updateFlashSale(id: string, data: IUpdateFlashSaleRequest): Promise<IApiResponse<IFlashSale>> {
    return httpClient.post<IApiResponse<IFlashSale>>(API_ENDPOINTS.FLASH_SALE.UPDATE(id), data);
  }

  public async deleteFlashSale(id: string): Promise<IApiResponse<any>> {
    return httpClient.delete<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.DELETE(id));
  }

  public async registerFlashSale(data: IRegisterFlashSaleRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.REGISTER, data);
  }

  public async reviewFlashSaleProduct(data: IReviewFlashSaleProductRequest): Promise<IApiResponse<any>> {
    return httpClient.post<IApiResponse<any>>(API_ENDPOINTS.FLASH_SALE.REVIEW_PRODUCT, data);
  }
}

export const flashSaleService = new FlashSaleService();
