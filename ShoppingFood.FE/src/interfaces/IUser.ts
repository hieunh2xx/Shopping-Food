/**
 * Mirrors backend UserDto.cs
 */
export interface IUserDto {
  id: string;
  userName: string;
  fullName: string;
  role: string;
  status: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/**
 * Mirrors backend LoginRequest
 */
export interface ILoginRequest {
  userName: string;
  password: string;
}

/**
 * Login response payload from POST /api/User/Login
 */
export interface ILoginResponse {
  token: string;
  username: string;
  role: string;
}

/**
 * Mirrors backend AddUserCommand
 */
export interface IRegisterRequest {
  userName: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

/**
 * Mirrors backend SellerRegisterDto.cs
 */
export interface ISellerRegisterDto {
  id: string;
  sellerApplicationId: string;
  userName: string;
  email: string;
  businessName: string;
  sellerApllicationStatus: string;
}

/**
 * Mirrors backend AddSellerCommand
 */
export interface IRegisterSellerRequest {
  userName: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessLicenseUrl: string;
  shopImageUrl: string;
  contactInfo: string;
}
