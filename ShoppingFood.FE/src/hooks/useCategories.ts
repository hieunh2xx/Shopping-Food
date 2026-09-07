import { useState, useCallback } from 'react';
import { productService, menuCategoryService } from '../services';
import type { IMenuCategoryDto, IAddMenuCategoryRequest, IUpdateMenuCategoryRequest } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * Hook tùy chỉnh Quản lý Danh mục Món ăn (useCategories).
 * Đóng gói logic tải danh mục, tạo mới và cập nhật danh mục thực đơn.
 */
export function useCategories() {
  const [categories, setCategories] = useState<IMenuCategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Tải danh sách toàn bộ các danh mục món ăn từ máy chủ.
   */
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

  /**
   * Tạo mới một danh mục thực đơn cho nhà hàng.
   * @param data - Thông tin tên danh mục và nhà hàng
   * @returns Dữ liệu danh mục mới tạo hoặc null nếu lỗi
   */
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

  /**
   * Cập nhật thông tin danh mục thực đơn hiện có.
   * @param id - Mã danh mục
   * @param data - Thông tin cập nhật
   * @returns Dữ liệu danh mục sau cập nhật hoặc null nếu lỗi
   */
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
