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
  isEmailActive?: boolean;
  phone: string | null;
  avatarUrl: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
  tier?: string | null;
  totalEarnedPoints?: number;
  pointsBalance?: number;
  sellerInfo?: ISellerInfoDto | null;
}

export interface ISellerInfoDto {
  restaurantId: string;
  restaurantName: string;
  status: string;
  address: string;
  averageRating: number;
  reviewCount: number;
  logoUrl?: string;
}

/**
 * Mirrors backend LoginRequest
 */
export interface ILoginRequest {
  userName: string;
  password: string;
}

export interface ILoginGoogleRequest {
  credential?: string;
}

export interface ILoginMicrosoftRequest {
  code: string;
  redirectUri: string;
}

/**
 * Login response payload from POST /api/User/Login
 */
export interface ILoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
}

export interface IPreAuthResponse {
  preAuthToken: string;
  availableMethods: string[];
  username: string;
}

/**
 * Mirrors backend AddUserCommand
 */
export interface IRegisterRequest {
  userName: string;
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  idToken: string;
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
  password?: string;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessLicenseUrl: string;
  shopImageUrl: string;
  contactInfo: string;
  idToken: string;
}

export interface IChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}

export interface IUserAddressDto {
  id: string;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  isDefault: boolean;
}

export interface IAddUserAddress {
  contactName: string;
  contactPhone: string;
  addressLine: string;
  isDefault: boolean;
}
