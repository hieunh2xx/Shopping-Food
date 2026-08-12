using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    public class TopUpWalletCommand : BaseCommand, IRequest<ApiResponse>
    {
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

            var session = await _paymentService.CreateTopUpSessionAsync(request.CurrentUserId.Value, request.Amount);
            if (session == null)
                return ApiResponse.Failure(500, "Không thể khởi tạo phiên nạp tiền qua SePay.");

            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { sessionId = session.Id }, "Khởi tạo thanh toán thành công.");
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
        private readonly IPaymentSessionRepository _sessionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmPaymentSessionHandler(
            IPaymentSettlementService paymentService,
            IPaymentSessionRepository sessionRepository,
            IUnitOfWork unitOfWork)
        {
            _paymentService = paymentService;
            _sessionRepository = sessionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ConfirmPaymentSessionCommand request, CancellationToken cancellationToken)
        {
            var sessions = await _sessionRepository.GetAsync(predicate: s => s.Id == request.SessionId);
            var session = sessions.FirstOrDefault();
            if (session == null)
                return ApiResponse.Failure(404, "Phiên thanh toán không tồn tại.");

            if (session.PaymentMethod == PaymentMethod.Sepay)
                return ApiResponse.Failure(400, "Thanh toán SePay chỉ được xác nhận sau khi ngân hàng gửi webhook.");

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
                return ApiResponse.Failure(400, $"Minimum withdrawal amount is {config.MinWithdrawalAmount:N0}đ.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile));
            var user = users.FirstOrDefault();
            if (user?.Profile == null)
                return ApiResponse.Failure(404, "User not found.");

            WalletOwnerType ownerType;
            Guid ownerId;
            decimal codDebt = 0;

            if (user.Profile.Role == UserRole.Seller || user.Profile.Role == UserRole.Mall)
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
                codDebt = shipper.CodCollectedAmount;
            }
            else
            {
                return ApiResponse.Failure(403, "Only Sellers and Shippers can request withdrawals.");
            }

            var wallet = await _paymentService.GetOrCreateWalletAsync(ownerType, ownerId);

            // Số dư khả dụng = Balance - yêu cầu rút đang chờ duyệt - nợ COD
            // Không trừ tiền ngay khi gửi yêu cầu; chỉ trừ khi Admin duyệt.
            var pendingWithdrawals = (await _withdrawalRepository.GetAsync(
                predicate: w => w.WalletId == wallet.Id && w.Status == WithdrawalStatus.Pending))
                ?.ToList() ?? new List<Domain.Models.WithdrawalRequest>();
            var pendingTotal = pendingWithdrawals.Sum(w => w.Amount);
            var availableBalance = wallet.Balance - pendingTotal - codDebt;
            if (availableBalance < request.Amount)
                return ApiResponse.Failure(400, "Insufficient balance. (Note: COD debt and pending withdrawals cannot be withdrawn)");

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

            await _unitOfWork.SaveChangesAsync();
            return ApiResponse.Success(new { withdrawalId = withdrawal.Id, status = "Pending" }, "Withdrawal request submitted successfully.");
        }
    }

    public class ApproveWithdrawalCommand : IRequest<ApiResponse>
    {
        public Guid WithdrawalId { get; set; }
        public bool Approve { get; set; }
        public string? RejectReason { get; set; }
        public string? TransferProofImageUrl { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class ApproveWithdrawalHandler : IRequestHandler<ApproveWithdrawalCommand, ApiResponse>
    {
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IWalletRepository _walletRepository;
        private readonly IFinancialTransactionRepository _transactionRepository;
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUnitOfWork _unitOfWork;

        public ApproveWithdrawalHandler(
            IWithdrawalRequestRepository withdrawalRepository,
            IWalletRepository walletRepository,
            IFinancialTransactionRepository transactionRepository,
            IPaymentSettlementService paymentService,
            IUnitOfWork unitOfWork)
        {
            _withdrawalRepository = withdrawalRepository;
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
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

            var relatedTx = await _transactionRepository.GetAsync(
                predicate: t => t.ReferenceId == withdrawal.Id
                    && t.Type == FinancialTransactionType.Withdrawal
                    && t.Amount < 0);
            var alreadyDebited = relatedTx != null && relatedTx.Any();

            if (request.Approve)
            {
                if (string.IsNullOrEmpty(request.TransferProofImageUrl))
                    return ApiResponse.Failure(400, "Please provide the transfer proof image url.");

                // Trừ tiền khi Admin duyệt (yêu cầu mới không trừ lúc gửi).
                // Yêu cầu cũ đã trừ sẵn: bỏ qua để tránh trừ 2 lần.
                if (!alreadyDebited)
                {
                    if (withdrawal.Wallet.Balance < withdrawal.Amount)
                        return ApiResponse.Failure(400, "Insufficient wallet balance to approve this withdrawal.");

                    await _paymentService.RecordTransactionAsync(
                        withdrawal.Wallet,
                        FinancialTransactionType.Withdrawal,
                        -withdrawal.Amount,
                        $"Rút tiền đã duyệt #{withdrawal.Id}",
                        withdrawal.Id,
                        "Withdrawal");
                }

                withdrawal.Status = WithdrawalStatus.Approved;
                withdrawal.ApprovedByUserId = request.CurrentUserId;
                withdrawal.TransferProofImageUrl = request.TransferProofImageUrl;
                withdrawal.ApprovedAt = DateTime.UtcNow;
            }
            else
            {
                withdrawal.Status = WithdrawalStatus.Rejected;
                withdrawal.RejectReason = request.RejectReason;

                // Chỉ hoàn tiền nếu lúc gửi yêu cầu đã trừ (luồng cũ).
                if (alreadyDebited)
                {
                    await _paymentService.RecordTransactionAsync(withdrawal.Wallet, FinancialTransactionType.Refund, withdrawal.Amount,
                        $"Hoàn tiền yêu cầu rút #{withdrawal.Id} bị từ chối", withdrawal.Id, "Withdrawal");
                }
            }
            withdrawal.UpdatedAt = DateTime.UtcNow;
            _withdrawalRepository.Update(withdrawal);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { status = withdrawal.Status.ToString() },
                request.Approve ? "Withdrawal approved successfully. Waiting for user confirmation." : "Withdrawal request rejected.");
        }
    }

    public class ConfirmWithdrawalReceivedCommand : IRequest<ApiResponse>
    {
        public Guid WithdrawalId { get; set; }
        public bool IsReceived { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class ConfirmWithdrawalReceivedHandler : IRequestHandler<ConfirmWithdrawalReceivedCommand, ApiResponse>
    {
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserRepository _userRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly IRestaurantProfileRepository _restaurantRepository;

        public ConfirmWithdrawalReceivedHandler(
            IWithdrawalRequestRepository withdrawalRepository,
            IUnitOfWork unitOfWork,
            IUserRepository userRepository,
            IShipperProfileRepository shipperRepository,
            IRestaurantProfileRepository restaurantRepository)
        {
            _withdrawalRepository = withdrawalRepository;
            _unitOfWork = unitOfWork;
            _userRepository = userRepository;
            _shipperRepository = shipperRepository;
            _restaurantRepository = restaurantRepository;
        }

        public async Task<ApiResponse> Handle(ConfirmWithdrawalReceivedCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue) return ApiResponse.Failure(401, "Unauthorized");

            var withdrawals = await _withdrawalRepository.GetAsync(
                predicate: w => w.Id == request.WithdrawalId,
                include: q => q.Include(w => w.Wallet),
                disableTracking: false);
            var withdrawal = withdrawals.FirstOrDefault();
            if (withdrawal == null) return ApiResponse.Failure(404, "Withdrawal not found.");
            if (withdrawal.Status != WithdrawalStatus.Approved)
                return ApiResponse.Failure(400, "Can only confirm approved requests.");

            // Verify ownership
            var users = await _userRepository.GetAsync(predicate: u => u.Id == request.CurrentUserId.Value, include: q => q.Include(u => u.Profile));
            var user = users.FirstOrDefault();
            if (user?.Profile == null) return ApiResponse.Failure(403, "Forbidden");

            bool isOwner = false;
            if (withdrawal.Wallet.OwnerType == WalletOwnerType.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(s => s.UserProfileId == user.Profile.Id);
                if (shippers.Any(s => s.Id == withdrawal.Wallet.OwnerId)) isOwner = true;
            }
            else if (withdrawal.Wallet.OwnerType == WalletOwnerType.Seller)
            {
                var rests = await _restaurantRepository.GetAsync(r => r.OwnerId == user.Profile.Id);
                if (rests.Any(r => r.Id == withdrawal.Wallet.OwnerId)) isOwner = true;
            }

            if (!isOwner) return ApiResponse.Failure(403, "You don't have permission to confirm this request.");

            if (request.IsReceived)
            {
                withdrawal.Status = WithdrawalStatus.Completed;
            }
            else
            {
                withdrawal.Status = WithdrawalStatus.Disputed;
            }
            
            withdrawal.UpdatedAt = DateTime.UtcNow;
            _withdrawalRepository.Update(withdrawal);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { status = withdrawal.Status.ToString() }, 
                request.IsReceived ? "Successfully confirmed withdrawal receipt." : "Dispute reported for withdrawal.");
        }
    }

    public class ForceCompleteWithdrawalCommand : IRequest<ApiResponse>
    {
        public Guid WithdrawalId { get; set; }
        public Guid? CurrentUserId { get; set; }
    }

    public class ForceCompleteWithdrawalHandler : IRequestHandler<ForceCompleteWithdrawalCommand, ApiResponse>
    {
        private readonly IWithdrawalRequestRepository _withdrawalRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ForceCompleteWithdrawalHandler(IWithdrawalRequestRepository withdrawalRepository, IUnitOfWork unitOfWork)
        {
            _withdrawalRepository = withdrawalRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(ForceCompleteWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var withdrawals = await _withdrawalRepository.GetAsync(w => w.Id == request.WithdrawalId, disableTracking: false);
            var withdrawal = withdrawals.FirstOrDefault();
            if (withdrawal == null) return ApiResponse.Failure(404, "Withdrawal not found.");
            
            if (withdrawal.Status != WithdrawalStatus.Disputed && withdrawal.Status != WithdrawalStatus.Approved)
                return ApiResponse.Failure(400, "Can only force complete approved or disputed requests.");

            withdrawal.Status = WithdrawalStatus.Completed;
            withdrawal.UpdatedAt = DateTime.UtcNow;
            _withdrawalRepository.Update(withdrawal);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(new { status = withdrawal.Status.ToString() }, "Successfully forced withdrawal completion.");
        }
    }

    public class UploadWithdrawalProofCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public Microsoft.AspNetCore.Http.IFormFile File { get; set; } = null!;
    }

    public class UploadWithdrawalProofHandler : IRequestHandler<UploadWithdrawalProofCommand, ApiResponse>
    {
        private readonly IPhotoService _photoService;

        public UploadWithdrawalProofHandler(IPhotoService photoService)
        {
            _photoService = photoService;
        }

        public async Task<ApiResponse> Handle(UploadWithdrawalProofCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue) return ApiResponse.Failure(401, "Unauthorized");
            if (request.File == null || request.File.Length == 0) return ApiResponse.Failure(400, "Please select an image file.");

            var imageUrl = await _photoService.AddPhotoAsync(request.File);
            if (string.IsNullOrEmpty(imageUrl))
                return ApiResponse.Failure(500, "Failed to upload image.");

            return ApiResponse.Success(new { imageUrl = imageUrl }, "Image uploaded successfully.");
        }
    }

    public class RepayShipperDebtCommand : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
        public string? ProofImageUrl { get; set; }
    }

    /// <summary>Giữ endpoint cũ: chuyển thành tạo yêu cầu chờ duyệt thay vì trừ ngay.</summary>
    public class RepayShipperDebtHandler : IRequestHandler<RepayShipperDebtCommand, ApiResponse>
    {
        private readonly IMediator _mediator;

        public RepayShipperDebtHandler(IMediator mediator)
        {
            _mediator = mediator;
        }

        public Task<ApiResponse> Handle(RepayShipperDebtCommand request, CancellationToken cancellationToken)
        {
            return _mediator.Send(new RequestCodRemittanceCommand
            {
                CurrentUserId = request.CurrentUserId,
                Amount = request.Amount,
                Note = request.Note,
                ProofImageUrl = request.ProofImageUrl
            }, cancellationToken);
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
                "Debt limit updated successfully.");
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
