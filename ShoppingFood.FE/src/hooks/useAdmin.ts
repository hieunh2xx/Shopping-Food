import { useState, useCallback } from 'react';
import { adminService } from '../services';
import type { IApproveApplicationRequest, IApproveProductRequest } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * useAdmin hook — encapsulates admin approval actions
 */
export function useAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveSellerApplication = useCallback(async (data: IApproveApplicationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.approveSellerApplication(data);
      if (!response.error) {
        toast.success(data.isApproved ? 'Đã duyệt hồ sơ đối tác!' : 'Đã từ chối hồ sơ đối tác.');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message);
        return false;
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message;
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const approveProduct = useCallback(async (data: IApproveProductRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminService.approveProduct(data);
      if (!response.error) {
        toast.success(data.isApproved ? 'Đã duyệt sản phẩm!' : 'Đã từ chối sản phẩm.');
        return true;
      } else {
        setError(response.message);
        toast.error(response.message);
        return false;
      }
    } catch (err: unknown) {
      const message = (err as any)?.response?.data?.message;
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    approveSellerApplication,
    approveProduct,
  };
}
