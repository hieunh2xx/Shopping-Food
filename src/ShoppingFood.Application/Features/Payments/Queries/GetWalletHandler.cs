using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;

namespace ShoppingFood.Application.Features.Payments.Queries
{
    public class GetWalletQuery : IRequest<ApiResponse>
    {
        public Guid? CurrentUserId { get; set; }
        public string? OwnerType { get; set; }
        public Guid? RestaurantId { get; set; }
    }

    public class GetWalletHandler : IRequestHandler<GetWalletQuery, ApiResponse>
    {
        private readonly IPaymentSettlementService _paymentService;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantRepository;
        private readonly IShipperProfileRepository _shipperRepository;
        private readonly ICodRemittanceRequestRepository _remittanceRepository;

        public GetWalletHandler(
            IPaymentSettlementService paymentService,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantRepository,
            IShipperProfileRepository shipperRepository,
            ICodRemittanceRequestRepository remittanceRepository)
        {
            _paymentService = paymentService;
            _userRepository = userRepository;
            _restaurantRepository = restaurantRepository;
            _shipperRepository = shipperRepository;
            _remittanceRepository = remittanceRepository;
        }

        public async Task<ApiResponse> Handle(GetWalletQuery request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            WalletOwnerType ownerType;
            Guid ownerId;

            if (request.OwnerType == "Seller" && request.RestaurantId.HasValue)
            {
                ownerType = WalletOwnerType.Seller;
                ownerId = request.RestaurantId.Value;
            }
            else
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile));
                var user = users.FirstOrDefault();
                if (user?.Profile == null)
                    return ApiResponse.Failure(404, "User not found.");

                switch (user.Profile.Role)
                {
                    case UserRole.Customer:
                        ownerType = WalletOwnerType.Customer;
                        ownerId = request.CurrentUserId.Value;
                        break;
                    case UserRole.Mall:
                    case UserRole.Seller:
                        var restaurants = await _restaurantRepository.GetAsync(
                            predicate: r => r.OwnerId == user.Profile.Id);
                        var restaurant = restaurants.FirstOrDefault();
                        if (restaurant == null)
                            return ApiResponse.Failure(404, "Restaurant not found.");
                        ownerType = WalletOwnerType.Seller;
                        ownerId = restaurant.Id;
                        break;
                    case UserRole.Shipper:
                        var shippers = await _shipperRepository.GetAsync(
                            predicate: s => s.UserProfileId == user.Profile.Id);
                        var shipper = shippers.FirstOrDefault();
                        if (shipper == null)
                            return ApiResponse.Failure(404, "Shipper profile not found.");
                        ownerType = WalletOwnerType.Shipper;
                        ownerId = shipper.Id;
                        break;
                    default:
                        ownerType = WalletOwnerType.Customer;
                        ownerId = request.CurrentUserId.Value;
                        break;
                }
            }

            var wallet = await _paymentService.GetOrCreateWalletAsync(ownerType, ownerId);

            decimal? codCollected = null;
            decimal? debtLimit = null;
            decimal? pendingCodRemittance = null;
            decimal? availableCodToRemit = null;
            if (ownerType == WalletOwnerType.Shipper)
            {
                var shippers = await _shipperRepository.GetAsync(predicate: s => s.Id == ownerId);
                var shipper = shippers.FirstOrDefault();
                codCollected = shipper?.CodCollectedAmount;
                debtLimit = shipper?.DebtLimit;
                if (shipper != null)
                {
                    var pending = await _remittanceRepository.GetAsync(
                        predicate: r => r.ShipperProfileId == shipper.Id && r.Status == CodRemittanceStatus.Pending,
                        disableTracking: true);
                    pendingCodRemittance = pending.Sum(r => r.Amount);
                    availableCodToRemit = Math.Max(0, (codCollected ?? 0) - pendingCodRemittance.Value);
                }
            }

            return ApiResponse.Success(new
            {
                wallet.Id,
                balance = wallet.Balance,
                ownerType = wallet.OwnerType.ToString(),
                bankName = wallet.BankName,
                bankAccountNumber = wallet.BankAccountNumber,
                bankAccountHolder = wallet.BankAccountHolder,
                codCollectedAmount = codCollected,
                pendingCodRemittance,
                availableCodToRemit,
                debtLimit,
                debtRemaining = debtLimit.HasValue && codCollected.HasValue ? (decimal?)Math.Max(0, debtLimit.Value - codCollected.Value) : null
            }, "Wallet retrieved.");
        }
    }
}
