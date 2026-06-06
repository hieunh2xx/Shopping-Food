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
        Shipper
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
        WaitingForDriver,
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
    
}
