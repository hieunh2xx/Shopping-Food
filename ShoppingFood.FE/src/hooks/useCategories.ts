import { useState, useCallback } from 'react';
import { productService, menuCategoryService } from '../services';
import type { IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * useCategories hook — encapsulates menu category operations
 */
export function useCategories() {
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getCategories();
      if (!response.error) {
        setCategories(response.data || []);
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data: IAddMenuCategoryRequest) => {
    setIsLoading(true);
    try {
      const response = await menuCategoryService.create(data);
      if (!response.error) {
        toast.success('Thêm danh mục thành công!');
        return response.data;
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: IUpdateMenuCategoryRequest) => {
    setIsLoading(true);
    try {
      const response = await menuCategoryService.update(id, data);
      if (!response.error) {
        toast.success('Cập nhật danh mục thành công!');
        return response.data;
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
  };
}
