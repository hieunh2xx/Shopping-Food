/**
 * Mirrors backend MenuCategoryDto.cs
 */
export interface IMenuCategoryDto {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
}

/**
 * Add menu category command
 */
export interface IAddMenuCategoryRequest {
  restaurantId: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

/**
 * Update menu category command
 */
export interface IUpdateMenuCategoryRequest {
  id: string;
  title?: string;
  description?: string;
  sortOrder?: number;
}
