using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    public class TopUpWalletCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public decimal Amount { get; set; }
    }

    public class TopUpWalletHandler : IRequestHandler<TopUpWalletCommand, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;

        public TopUpWalletHandler(IPaymentSettlementService paymentService, IUnitOfWork unitOfWork)
        {
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(TopUpWalletCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");
            if (request.Amount < 10_000)
                return ApiResponse.Failure(400, "Số tiền nạp tối thiểu là 10.000đ.");

            var wallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Customer, request.CurrentUserId.Value);
            await _paymentService.RecordTransactionAsync(wallet, FinancialTransactionType.TopUp, request.Amount,
                $"Nạp tiền vào ví hệ thống");
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { balance = wallet.Balance }, "Nạp tiền thành công.");
        }
    }

    public class ConfirmPaymentSessionCommand : IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class ConfirmPaymentSessionHandler : IRequestHandler<ConfirmPaymentSessionCommand, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmPaymentSessionHandler(IPaymentSettlementService paymentService, IUnitOfWork unitOfWork)
        {
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ConfirmPaymentSessionCommand request, CancellationToken cancellationToken)
        {
            await _paymentService.ConfirmPaymentSessionAsync(request.SessionId);
            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(null, "Thanh toán thành công.");
        }
    }

    public class RequestWithdrawalCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public decimal Amount { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string BankAccountNumber { get; set; } = string.Empty;
        public string BankAccountHolder { get; set; } = string.Empty;
        public Guid? RestaurantId { get; set; }
    }

    public class RequestWithdrawalHandler : IRequestHandler<RequestWithdrawalCommand, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RequestWithdrawalHandler(
            IPaymentSettlementService paymentService,
            IWithdrawalRequestRepository withdrawalRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantRepository,
            IShipperProfileRepository shipperRepository,
            IUnitOfWork unitOfWork)
        {
            _paymentService = paymentService;
            _withdrawalRepository = withdrawalRepository;
            _userRepository = userRepository;
            _restaurantRepository = restaurantRepository;
            _shipperRepository = shipperRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RequestWithdrawalCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var config = await _paymentService.GetConfigAsync();
            if (request.Amount < config.MinWithdrawalAmount)
                return ApiResponse.Failure(400, $"Số tiền rút tối thiểu là {config.MinWithdrawalAmount:N0}đ.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User not found.");

            WalletOwnerType ownerType;
            Guid ownerId;

            if (user.Profile.Role == UserRole.Seller)
            {
                var restaurants = await _restaurantRepository.GetAsync(
                    predicate: r => r.OwnerId == user.Profile.Id);
                var restaurant = restaurants.FirstOrDefault();
                if (restaurant == null) return ApiResponse.Failure(404, "Restaurant not found.");
                ownerType = WalletOwnerType.Seller;
                ownerId = restaurant.Id;
            }
            else if (user.Profile.Role == UserRole.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(
                    predicate: s => s.UserProfileId == user.Profile.Id);
                var shipper = shippers.FirstOrDefault();
                if (shipper == null) return ApiResponse.Failure(404, "Shipper not found.");
                ownerType = WalletOwnerType.Shipper;
                ownerId = shipper.Id;
            }
            else
            {
                return ApiResponse.Failure(403, "Chỉ Seller và Shipper mới được rút tiền.");
            }

            var wallet = await _paymentService.GetOrCreateWalletAsync(ownerType, ownerId);
            if (wallet.Balance < request.Amount)
                return ApiResponse.Failure(400, "Số dư không đủ.");

            wallet.BankName = request.BankName;
            wallet.BankAccountNumber = request.BankAccountNumber;
            wallet.BankAccountHolder = request.BankAccountHolder;

            var withdrawal = new Domain.Models.WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Amount = request.Amount,
                BankName = request.BankName,
                BankAccountNumber = request.BankAccountNumber,
                BankAccountHolder = request.BankAccountHolder,
                Status = WithdrawalStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _withdrawalRepository.Add(withdrawal);

            await _paymentService.RecordTransactionAsync(wallet, FinancialTransactionType.Withdrawal, -request.Amount,
                $"Yêu cầu rút tiền #{withdrawal.Id}", withdrawal.Id, "Withdrawal");

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(new { withdrawalId = withdrawal.Id, status = "Pending" }, "Yêu cầu rút tiền đã được gửi.");
        }
    }

    public class ApproveWithdrawalCommand : IRequest<ApiResponse>
    {
        public Guid WithdrawalId { get; set; }
        public bool Approve { get; set; }
        public string? RejectReason { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class ApproveWithdrawalHandler : IRequestHandler<ApproveWithdrawalCommand, ApiResponse>
    {
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;

        public ApproveWithdrawalHandler(
            IWithdrawalRequestRepository withdrawalRepository,
            IWalletRepository walletRepository,
            IPaymentSettlementService paymentService,
            IUnitOfWork unitOfWork)
        {
            _withdrawalRepository = withdrawalRepository;
            _walletRepository = walletRepository;
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ApproveWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var withdrawals = await _withdrawalRepository.GetAsync(
                predicate: w => w.Id == request.WithdrawalId,
                include: q => q.Include(w => w.Wallet),
                disableTracking: false);
            var withdrawal = withdrawals.FirstOrDefault();
            if (withdrawal == null) return ApiResponse.Failure(404, "Withdrawal not found.");
            if (withdrawal.Status != WithdrawalStatus.Pending)
                return ApiResponse.Failure(400, "Withdrawal already processed.");

            if (request.Approve)
            {
                withdrawal.Status = WithdrawalStatus.Approved;
                withdrawal.ApprovedByUserId = request.CurrentUserId;
            }
            else
            {
                withdrawal.Status = WithdrawalStatus.Rejected;
                withdrawal.RejectReason = request.RejectReason;
                await _paymentService.RecordTransactionAsync(withdrawal.Wallet, FinancialTransactionType.Refund, withdrawal.Amount,
                    $"Hoàn tiền yêu cầu rút #{withdrawal.Id} bị từ chối", withdrawal.Id, "Withdrawal");
            }
            withdrawal.UpdatedAt = DateTime.UtcNow;
            _withdrawalRepository.Update(withdrawal);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { status = withdrawal.Status.ToString() },
                request.Approve ? "Đã duyệt rút tiền." : "Đã từ chối yêu cầu rút tiền.");
        }
    }

    public class RepayShipperDebtCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public decimal Amount { get; set; }
    }

    public class RepayShipperDebtHandler : IRequestHandler<RepayShipperDebtCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;

        public RepayShipperDebtHandler(
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            IPaymentSettlementService paymentService,
            IUnitOfWork unitOfWork)
        {
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _paymentService = paymentService;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RepayShipperDebtCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");
            if (request.Amount <= 0)
                return ApiResponse.Failure(400, "Số tiền không hợp lệ.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var profile = users.FirstOrDefault()?.Profile;
            if (profile?.Role != UserRole.Shipper)
                return ApiResponse.Failure(403, "Chỉ shipper mới được nộp công nợ.");

            var shippers = await _shipperRepository.GetAsync(
                predicate: s => s.UserProfileId == profile.Id,
                disableTracking: false);
            var shipper = shippers.FirstOrDefault();
            if (shipper == null) return ApiResponse.Failure(404, "Shipper not found.");
            if (shipper.CodCollectedAmount <= 0)
                return ApiResponse.Failure(400, "Không có công nợ cần nộp.");

            var repayAmount = Math.Min(request.Amount, shipper.CodCollectedAmount);
            shipper.CodCollectedAmount -= repayAmount;
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperRepository.Update(shipper);

            var wallet = await _paymentService.GetOrCreateWalletAsync(WalletOwnerType.Shipper, shipper.Id);
            await _paymentService.RecordTransactionAsync(wallet, FinancialTransactionType.CodRemittance, -repayAmount,
                $"Nộp tiền thu hộ COD về sàn", null, "CodRemittance");

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(new
            {
                repaid = repayAmount,
                remainingDebt = shipper.CodCollectedAmount,
                debtLimit = shipper.DebtLimit
            }, "Nộp công nợ thành công.");
        }
    }

    public class UpdateShipperDebtLimitCommand : IRequest<ApiResponse>
    {
        public Guid ShipperProfileId { get; set; }
        public decimal DebtLimit { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class UpdateShipperDebtLimitHandler : IRequestHandler<UpdateShipperDebtLimitCommand, ApiResponse>
    {
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateShipperDebtLimitHandler(
            IShipperProfileRepository shipperRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _shipperRepository = shipperRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(UpdateShipperDebtLimitCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            if (users.FirstOrDefault()?.Profile?.Role != UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden.");

            var shippers = await _shipperRepository.GetAsync(
                predicate: s => s.Id == request.ShipperProfileId,
                disableTracking: false);
            var shipper = shippers.FirstOrDefault();
            if (shipper == null) return ApiResponse.Failure(404, "Shipper not found.");

            shipper.DebtLimit = request.DebtLimit;
            shipper.UpdatedAt = DateTime.UtcNow;
            _shipperRepository.Update(shipper);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { shipper.Id, shipper.DebtLimit, shipper.CodCollectedAmount },
                "Cập nhật hạn mức công nợ thành công.");
        }
    }

    public class RequestInvoiceCommand : IRequest<ApiResponse>
    {
        public Guid OrderId { get; set; }
        public string TaxCode { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string CompanyAddress { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? CurrentUserId { get; set; }
    }

    public class RequestInvoiceHandler : IRequestHandler<RequestInvoiceCommand, ApiResponse>
    {
        private readonly IEInvoiceRequestRepository _invoiceRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RequestInvoiceHandler(
            IEInvoiceRequestRepository invoiceRepository,
            IOrderRepository orderRepository,
            IUnitOfWork unitOfWork)
        {
            _invoiceRepository = invoiceRepository;
            _orderRepository = orderRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(RequestInvoiceCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var order = await _orderRepository.GetByIdAsync(request.OrderId);
            if (order == null) return ApiResponse.Failure(404, "Order not found.");
            if (order.UserAccountId != request.CurrentUserId)
                return ApiResponse.Failure(403, "Forbidden.");

            var invoice = new Domain.Models.EInvoiceRequest
            {
                Id = Guid.NewGuid(),
                OrderId = request.OrderId,
                UserAccountId = request.CurrentUserId.Value,
                TaxCode = request.TaxCode,
                CompanyName = request.CompanyName,
                CompanyAddress = request.CompanyAddress,
                Email = request.Email,
                Status = InvoiceStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _invoiceRepository.Add(invoice);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { invoiceId = invoice.Id, status = "Pending" },
                "Yêu cầu hóa đơn điện tử đã được gửi.");
        }
    }
}
