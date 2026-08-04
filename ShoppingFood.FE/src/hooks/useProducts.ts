import { useState, useCallback } from 'react';
import { productService } from '../services';
import type { IProductDto, ISearchProductQuery, IAddProductRequest, IUpdateProductRequest } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * useProducts hook — encapsulates all product CRUD and search logic
 */
export function useProducts() {
  const [products, setProducts] = useState<IProductDto[]>([]);
  const [product, setProduct] = useState<IProductDto | null>(null);
  const [bestSellers, setBestSellers] = useState<IProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (params?: { filter?: string; skip?: number; take?: number; restaurantId?: string; categoryId?: string; status?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getAll(params);
      if (!response.error) {
        setProducts(response.data || []);
        setTotal(response.total);
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.getById(id);
      if (!response.error) {
        setProduct(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: ISearchProductQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.search(query);
      if (!response.error) {
        setProducts((response.data || []).filter(p => !p.isHidden));
        setTotal(response.total);
      } else {
        setError(response.message);
      }
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBestSellers = useCallback(async (take: number = 10) => {
    setIsLoading(true);
    try {
      const response = await productService.getBestSellers(take);
      if (!response.error) {
        setBestSellers((response.data || []).filter(p => !p.isHidden));
      }
    } catch {
      // Silent fail for best sellers
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (data: IAddProductRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.create(data);
      if (!response.error) {
        toast.success('Thêm món ăn mới thành công!');
        return response.data;
      } else {
        setError(response.message);
        toast.error(response.message);
        return null;
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message;
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (id: string, data: IUpdateProductRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productService.update(id, data);
      if (!response.error) {
        toast.success('Cập nhật thông tin món ăn thành công!');
        return response.data;
      } else {
        setError(response.message);
        toast.error(response.message);
        return null;
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message;
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await productService.remove(id);
      if (!response.error) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Xóa món ăn khỏi thực đơn thành công!');
        return true;
      } else {
        toast.error(response.message);
        return false;
      }
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    product,
    bestSellers,
    total,
    isLoading,
    error,
    fetchProducts,
    fetchProductById,
    searchProducts,
    fetchBestSellers,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
