namespace ShoppingFood.Domain.Enums
{
    public enum DeliveryType
    {
        PlatformDelivery,
        SelfDelivery
    }

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

    public enum ApplicationStatus
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
        EWallet,
        SystemWallet,
        Sepay
    }

    public enum PaymentStatus
    {
        Pending,
        Paid,
        Failed,
        Refunded,
        Settled
    }

    public enum WalletOwnerType
    {
        Customer,
        Seller,
        Shipper,
        Platform
    }

    public enum FinancialTransactionType
    {
        TopUp,
        Payment,
        Refund,
        Withdrawal,
        Commission,
        SellerPayout,
        ShipperEarning,
        CodCollection,
        CodRemittance,
        Adjustment,
        /// <summary>Sàn bù phí giao (freeship / ShippingFee &lt; ShipperIncome).</summary>
        ShippingSubsidy
    }

    public enum WithdrawalStatus
    {
        Pending,
        Approved,
        Rejected,
        Completed,
        Disputed
    }

    public enum CodRemittanceStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public enum InvoiceStatus
    {
        Pending,
        Issued,
        Rejected
    }

    public enum EWalletProvider
  
    {
        Momo,
        ZaloPay,
        VNPay
    }

    public enum PaymentSessionStatus
    {
        Pending,
        Completed,
        Failed,
        Expired
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

    public enum DispatchActionType
    {
        ManualAssigned,
        Accepted,
        Rejected,
        Expired,
        Canceled
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

    public enum NotificationType
    {
        System,
        Order,
        Delivery,
        Loyalty,
        Review,
        Payment
    }

    public enum ReportStatus
    {
        Pending,
        Resolved,
        Dismissed,
        Escalated
    }

    public enum ReportTargetType
    {
        Product,
        Order,
        Shipper,
        Review,
        Restaurant,
        SystemAppeal
    }

    public enum ExplanationRequestStatus
    {
        Pending,
        Replied
    }

    public enum TargetAudience
    {
        AllCustomers,
        ByTier,
        SpecificCustomers
    }

    public enum ChatSessionStatus
    {
        Open,
        Closed
    }

    public enum ChatTopic
    {
        OrderIssue,
        OrderCancellation,
        SystemIssue,
        General
    }

    public enum ComplaintResolutionType
    {
        Warning,
        ShipperFault,
        SellerFault,
        CustomerFault,
        CompensateCustomer,
        ForceCancelNoPenalty,
        Dismiss,
        EscalateToAdmin,
        NoFault
    }
}
