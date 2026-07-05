import { httpClient } from './base/HttpClient';
import { API_ENDPOINTS } from '../config/endpoints';
import type { 
  IApiResponse, 
  IFlashSale, 
  IFlashSaleProduct, 
  ICreateFlashSaleRequest, 
  IUpdateFlashSaleRequest, 
  IRegisterFlashSaleRequest, 
  IReviewFlashSaleProductRequest 
} from '../interfaces';

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

  public async getFlashSaleProducts(flashSaleId: string, skip = 0, take = 50): Promise<IApiResponse<{ total: number; data: IFlashSaleProduct[] }>> {
    return httpClient.get<IApiResponse<{ total: number; data: IFlashSaleProduct[] }>>(API_ENDPOINTS.FLASH_SALE.PRODUCTS(flashSaleId), {
      params: { skip, take }
    });
  }
}

export const flashSaleService = new FlashSaleService();
