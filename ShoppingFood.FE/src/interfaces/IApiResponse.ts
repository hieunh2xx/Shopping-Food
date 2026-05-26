/**
 * Mirrors backend ApiResponse.cs
 * Standard API response wrapper for all endpoints
 */
export interface IApiResponse<T = unknown> {
  error: boolean;
  code: number;
  message: string;
  data: T;
  total: number;
}

/**
 * Query parameters for paginated endpoints
 */
export interface IQueryParams {
  filter?: string;
  skip?: number;
  take?: number;
}
