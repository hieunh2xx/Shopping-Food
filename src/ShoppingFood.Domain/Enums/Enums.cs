namespace ShoppingFood.Domain.Enums
{
    public enum UserStatus
    {
        Pending,
        Active,
        Inactive,
        Blocked
    }

    public enum UserRole
    {
        Admin,
        Seller,
        Mall,
        Customer,
        Shipper,
        Coordinator
    }

    public enum SellerApplicationStatus
    {
        Pending,
        Approved,
        Rejected,
        NeedsInfo
    }

    public enum ProductStatus{
        Pending,
        Approved,
        Rejected,
        
    }

    public enum ProductReportStatus
    {
        Pending,
        Resolved,
        Dismissed
    }
    public enum RestaurantStatus
    {
        Active,
        Inactive,
        Suspended
    }

    public enum StockStatus
    {
        InStock,
        OutOfStock
    }

    public enum OrderStatus
    {
        Pending,
        Confirmed,
        Preparing,
        WaitingForShipper,
        Shipping,
        Delivered,
        Cancelled
    }

    public enum PaymentMethod
    {
        COD,
        CreditCard,
        EWallet
    }

    public enum VehicleType
    {
        Motorcycle,
        ElectricMotorbike,
        Car
    }
    
    public enum ProposalStatus
    {
        Pending,
        Accepted,
        Rejected,
        Expired
    }
    
    public enum DiscountType
    {
        Percentage,
        FixedAmount,
        FreeShipping
    }

    public enum DiscountStatus
    {
        Active,
        Inactive,
        Cancelled
    }

    public enum MemberTier
    {
        Bronze,
        Silver,
        Gold,
        Diamond
    }

    public enum PointTransactionType
    {
        EarnFromOrder,
        RedeemVoucher,
        AdminAdjustment
    }

    public enum FlashSaleStatus
    {
        Pending,
        Active,
        Ended
    }

    public enum FlashSaleProductStatus
    {
        Pending,
        Approved,
        Rejected
    }
}
