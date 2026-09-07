import { useState, useCallback } from 'react';
import { adminService } from '../services';
import type { IApproveApplicationRequest, IApproveProductRequest } from '../interfaces';
import toast from 'react-hot-toast';

/**
 * Hook tùy chỉnh dành cho Quản trị viên (useAdmin).
 * Đóng gói các tác vụ phê duyệt hồ sơ đối tác (Người bán, Tài xế) và phê duyệt kiểm duyệt món ăn/sản phẩm mới.
 */
export function useAdmin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Phê duyệt hoặc từ chối hồ sơ đăng ký mở quán của đối tác Người bán hàng.
   * @param data - Mã hồ sơ, quyết định phê duyệt và lý do từ chối nếu có
   * @returns true nếu thực hiện thành công, ngược lại false
   */
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

  /**
   * Phê duyệt hoặc từ chối sản phẩm món ăn mới do Người bán đăng tải.
   * @param data - Mã sản phẩm, cờ isApproved và lý do từ chối nếu có
   * @returns true nếu thao tác thành công, ngược lại false
   */
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
