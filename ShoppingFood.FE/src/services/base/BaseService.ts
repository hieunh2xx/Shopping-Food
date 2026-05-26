import { httpClient } from './HttpClient';
import type { IApiResponse, IQueryParams } from '../../interfaces';

/**
 * Abstract Base Service — OOP foundation for all API services
 * 
 * Implements: OCP (Open/Closed), LSP (Liskov Substitution)
 * - Provides standard CRUD operations that child classes inherit
 * - Children can override or extend without modifying base
 * - Any child can substitute for BaseService
 * 
 * @template TDto - The DTO type returned from the API
 * @template TCreateCmd - The command type for creating entities
 * @template TUpdateCmd - The command type for updating entities
 */
export abstract class BaseService<TDto, TCreateCmd = unknown, TUpdateCmd = unknown> {
  /**
   * API endpoint path (e.g., '/User', '/Product')
   * Must be defined by child classes
   */
  protected abstract readonly endpoint: string;

  /**
   * GET all entities with optional pagination/filter
   */
  async getAll(params?: IQueryParams): Promise<IApiResponse<TDto[]>> {
    return httpClient.get<IApiResponse<TDto[]>>(this.endpoint, { params });
  }

  /**
   * GET entity by ID
   */
  async getById(id: string): Promise<IApiResponse<TDto>> {
    return httpClient.get<IApiResponse<TDto>>(`${this.endpoint}/${id}`);
  }

  /**
   * POST create a new entity
   */
  async create(data: TCreateCmd): Promise<IApiResponse<TDto>> {
    return httpClient.post<IApiResponse<TDto>>(this.endpoint, data);
  }

  /**
   * PUT update an existing entity
   */
  async update(id: string, data: TUpdateCmd): Promise<IApiResponse<TDto>> {
    return httpClient.put<IApiResponse<TDto>>(`${this.endpoint}/${id}`, data);
  }

  /**
   * DELETE an entity by ID
   */
  async remove(id: string): Promise<IApiResponse<void>> {
    return httpClient.delete<IApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
