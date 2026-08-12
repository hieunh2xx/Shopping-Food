using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Payments.Commands;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Payments
{
    public class TopUpWalletHandlerTests
    {
        private readonly Mock<IPaymentSettlementService> _paymentServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly TopUpWalletHandler _handler;

        public TopUpWalletHandlerTests()
        {
            _paymentServiceMock = new Mock<IPaymentSettlementService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new TopUpWalletHandler(_paymentServiceMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_NoCurrentUser_Returns401()
        {
            var cmd = new TopUpWalletCommand { CurrentUserId = null, Amount = 50_000 };
            var result = await _handler.Handle(cmd, CancellationToken.None);
            result.Code.Should().Be(401);
        }

        [Fact]
        public async Task Handle_AmountBelowMinimum_Returns400()
        {
            var cmd = new TopUpWalletCommand { CurrentUserId = Guid.NewGuid(), Amount = 1_000 };
            var result = await _handler.Handle(cmd, CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_SessionNull_Returns500()
        {
            _paymentServiceMock.Setup(p => p.CreateTopUpSessionAsync(It.IsAny<Guid>(), It.IsAny<decimal>()))
                .ReturnsAsync((PaymentSession?)null);
            var cmd = new TopUpWalletCommand { CurrentUserId = Guid.NewGuid(), Amount = 50_000 };
            var result = await _handler.Handle(cmd, CancellationToken.None);
            result.Code.Should().Be(500);
        }

        [Fact]
        public async Task Handle_ValidRequest_Returns200AndCreatesSession()
        {
            var sessionId = Guid.NewGuid();
            _paymentServiceMock.Setup(p => p.CreateTopUpSessionAsync(It.IsAny<Guid>(), It.IsAny<decimal>()))
                .ReturnsAsync(new PaymentSession { Id = sessionId });

            var cmd = new TopUpWalletCommand { CurrentUserId = Guid.NewGuid(), Amount = 50_000 };
            var result = await _handler.Handle(cmd, CancellationToken.None);

            result.Code.Should().Be(200);
            _paymentServiceMock.Verify(p => p.CreateTopUpSessionAsync(cmd.CurrentUserId.Value, cmd.Amount), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }

    public class ConfirmPaymentSessionHandlerTests
    {
        private readonly Mock<IPaymentSettlementService> _paymentServiceMock;
        private readonly Mock<IPaymentSessionRepository> _sessionRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly ConfirmPaymentSessionHandler _handler;

        public ConfirmPaymentSessionHandlerTests()
        {
            _paymentServiceMock = new Mock<IPaymentSettlementService>();
            _sessionRepoMock = new Mock<IPaymentSessionRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new ConfirmPaymentSessionHandler(
                _paymentServiceMock.Object, _sessionRepoMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_SessionNotFound_Returns404()
        {
            _sessionRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<PaymentSession, bool>>>()))
                .ReturnsAsync(new List<PaymentSession>());
            var result = await _handler.Handle(new ConfirmPaymentSessionCommand { SessionId = Guid.NewGuid() }, CancellationToken.None);
            result.Code.Should().Be(404);
        }

        [Fact]
        public async Task Handle_SepaySession_Returns400()
        {
            _sessionRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<PaymentSession, bool>>>()))
                .ReturnsAsync(new List<PaymentSession> { new PaymentSession { PaymentMethod = PaymentMethod.Sepay } });
            var result = await _handler.Handle(new ConfirmPaymentSessionCommand { SessionId = Guid.NewGuid() }, CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_Valid_ConfirmsPayment()
        {
            var sessionId = Guid.NewGuid();
            _sessionRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<PaymentSession, bool>>>()))
                .ReturnsAsync(new List<PaymentSession> { new PaymentSession { PaymentMethod = PaymentMethod.SystemWallet } });

            var result = await _handler.Handle(new ConfirmPaymentSessionCommand { SessionId = sessionId }, CancellationToken.None);

            result.Code.Should().Be(200);
            _paymentServiceMock.Verify(p => p.ConfirmPaymentSessionAsync(sessionId), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }

    public class RequestWithdrawalHandlerTests
    {
        private readonly Mock<IPaymentSettlementService> _paymentServiceMock;
        private readonly Mock<IWithdrawalRequestRepository> _withdrawalRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IRestaurantProfileRepository> _restaurantRepoMock;
        private readonly Mock<IShipperProfileRepository> _shipperRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly RequestWithdrawalHandler _handler;
        private readonly User _user;
        private readonly UserProfile _profile;
        private readonly Guid _userId;

        public RequestWithdrawalHandlerTests()
        {
            _paymentServiceMock = new Mock<IPaymentSettlementService>();
            _withdrawalRepoMock = new Mock<IWithdrawalRequestRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _restaurantRepoMock = new Mock<IRestaurantProfileRepository>();
            _shipperRepoMock = new Mock<IShipperProfileRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new RequestWithdrawalHandler(
                _paymentServiceMock.Object,
                _withdrawalRepoMock.Object,
                _userRepoMock.Object,
                _restaurantRepoMock.Object,
                _shipperRepoMock.Object,
                _unitOfWorkMock.Object);

            _userId = Guid.NewGuid();
            _profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Shipper, UserAccountId = _userId };
            _user = new User { Id = _userId, Profile = _profile };

            _paymentServiceMock.Setup(p => p.GetConfigAsync())
                .ReturnsAsync(new PlatformFinanceConfig { MinWithdrawalAmount = 20_000 });
        }

        private void SetupUser() =>
            _userRepoMock.Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>>(),
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<User> { _user });

        private RequestWithdrawalCommand ValidCommand() => new RequestWithdrawalCommand
        {
            CurrentUserId = _userId,
            Amount = 100_000,
            BankName = "VCB",
            BankAccountNumber = "123456",
            BankAccountHolder = "Nguyen Van A"
        };

        [Fact]
        public async Task Handle_NoUser_Returns401()
        {
            var cmd = new RequestWithdrawalCommand { CurrentUserId = null };
            var result = await _handler.Handle(cmd, CancellationToken.None);
            result.Code.Should().Be(401);
        }

        [Fact]
        public async Task Handle_BelowMinAmount_Returns400()
        {
            _paymentServiceMock.Setup(p => p.GetConfigAsync()).ReturnsAsync(new PlatformFinanceConfig { MinWithdrawalAmount = 100_001 });
            var result = await _handler.Handle(ValidCommand(), CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_UserProfileMissing_Returns404()
        {
            var userWithoutProfile = new User { Id = Guid.NewGuid(), Profile = null };
            _userRepoMock.Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<User, bool>>>(),
                    It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>>(),
                    It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<User> { userWithoutProfile });
            var cmd = ValidCommand(); cmd.CurrentUserId = userWithoutProfile.Id;
            var result = await _handler.Handle(cmd, CancellationToken.None);
            result.Code.Should().Be(404);
        }

        [Fact]
        public async Task Handle_SellerWithoutRestaurant_Returns404()
        {
            _profile.Role = UserRole.Seller;
            SetupUser();
            _restaurantRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<RestaurantProfile, bool>>>()))
                .ReturnsAsync(new List<RestaurantProfile>());

            var result = await _handler.Handle(ValidCommand(), CancellationToken.None);
            result.Code.Should().Be(404);
        }

        [Fact]
        public async Task Handle_SellerSuccess_CreatesWithdrawal()
        {
            _profile.Role = UserRole.Seller;
            var restaurant = new RestaurantProfile { Id = Guid.NewGuid(), OwnerId = _profile.Id };
            var wallet = new Wallet { Id = Guid.NewGuid(), Balance = 1_000_000 };
            SetupUser();
            _restaurantRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<RestaurantProfile, bool>>>()))
                .ReturnsAsync(new List<RestaurantProfile> { restaurant });
            _paymentServiceMock.Setup(p => p.GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurant.Id))
                .ReturnsAsync(wallet);

            var result = await _handler.Handle(ValidCommand(), CancellationToken.None);

            result.Code.Should().Be(200);
            _withdrawalRepoMock.Verify(r => r.Add(It.IsAny<WithdrawalRequest>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_InsufficientBalance_Returns400()
        {
            _profile.Role = UserRole.Seller;
            var restaurant = new RestaurantProfile { Id = Guid.NewGuid(), OwnerId = _profile.Id };
            var wallet = new Wallet { Id = Guid.NewGuid(), Balance = 10_000 };
            SetupUser();
            _restaurantRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<RestaurantProfile, bool>>>()))
                .ReturnsAsync(new List<RestaurantProfile> { restaurant });
            _paymentServiceMock.Setup(p => p.GetOrCreateWalletAsync(WalletOwnerType.Seller, restaurant.Id))
                .ReturnsAsync(wallet);

            var result = await _handler.Handle(ValidCommand(), CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_RoleNotAllowed_Returns403()
        {
            _profile.Role = UserRole.Customer;
            SetupUser();
            var result = await _handler.Handle(ValidCommand(), CancellationToken.None);
            result.Code.Should().Be(403);
        }
    }

    public class ApproveWithdrawalHandlerTests
    {
        private readonly Mock<IWithdrawalRequestRepository> _withdrawalRepoMock;
        private readonly Mock<IWalletRepository> _walletRepoMock;
        private readonly Mock<IPaymentSettlementService> _paymentServiceMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly ApproveWithdrawalHandler _handler;

        public ApproveWithdrawalHandlerTests()
        {
            _withdrawalRepoMock = new Mock<IWithdrawalRequestRepository>();
            _walletRepoMock = new Mock<IWalletRepository>();
            _paymentServiceMock = new Mock<IPaymentSettlementService>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new ApproveWithdrawalHandler(
                _withdrawalRepoMock.Object,
                _walletRepoMock.Object,
                new Mock<IFinancialTransactionRepository>().Object,
                _paymentServiceMock.Object,
                _unitOfWorkMock.Object);
        }

        private void SetupWithdrawal(WithdrawalRequest w) =>
            _withdrawalRepoMock.Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<WithdrawalRequest, bool>>>(),
                    It.IsAny<Func<IQueryable<WithdrawalRequest>, IOrderedQueryable<WithdrawalRequest>>>(),
                    It.IsAny<Func<IQueryable<WithdrawalRequest>, IIncludableQueryable<WithdrawalRequest, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<WithdrawalRequest> { w });

        [Fact]
        public async Task Handle_NotFound_Returns404()
        {
            _withdrawalRepoMock.Setup(r => r.GetAsync(
                    It.IsAny<Expression<Func<WithdrawalRequest, bool>>>(),
                    It.IsAny<Func<IQueryable<WithdrawalRequest>, IOrderedQueryable<WithdrawalRequest>>>(),
                    It.IsAny<Func<IQueryable<WithdrawalRequest>, IIncludableQueryable<WithdrawalRequest, object>>>(),
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<WithdrawalRequest>());
            var result = await _handler.Handle(new ApproveWithdrawalCommand { WithdrawalId = Guid.NewGuid(), Approve = true }, CancellationToken.None);
            result.Code.Should().Be(404);
        }

        [Fact]
        public async Task Handle_AlreadyProcessed_Returns400()
        {
            SetupWithdrawal(new WithdrawalRequest { Status = WithdrawalStatus.Completed });
            var result = await _handler.Handle(new ApproveWithdrawalCommand { WithdrawalId = Guid.NewGuid(), Approve = true }, CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_ApproveWithoutProof_Returns400()
        {
            SetupWithdrawal(new WithdrawalRequest { Status = WithdrawalStatus.Pending });
            var result = await _handler.Handle(new ApproveWithdrawalCommand { WithdrawalId = Guid.NewGuid(), Approve = true }, CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_Approve_Returns200AndSetsApproved()
        {
            var withdrawal = new WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                Status = WithdrawalStatus.Pending,
                Amount = 100_000,
                Wallet = new Wallet { Id = Guid.NewGuid(), Balance = 500_000 }
            };
            SetupWithdrawal(withdrawal);

            var result = await _handler.Handle(new ApproveWithdrawalCommand
            {
                WithdrawalId = withdrawal.Id,
                Approve = true,
                TransferProofImageUrl = "https://proof"
            }, CancellationToken.None);

            result.Code.Should().Be(200);
            withdrawal.Status.Should().Be(WithdrawalStatus.Approved);
            _paymentServiceMock.Verify(p => p.RecordTransactionAsync(withdrawal.Wallet, FinancialTransactionType.Withdrawal, -withdrawal.Amount,
                It.IsAny<string>(), withdrawal.Id, "Withdrawal"), Times.Once);
            _withdrawalRepoMock.Verify(r => r.Update(withdrawal), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task Handle_Reject_WithoutPriorDebit_DoesNotRefund()
        {
            var withdrawal = new WithdrawalRequest
            {
                Id = Guid.NewGuid(),
                Status = WithdrawalStatus.Pending,
                Amount = 100_000,
                Wallet = new Wallet { Id = Guid.NewGuid(), Balance = 500_000 }
            };
            SetupWithdrawal(withdrawal);

            var result = await _handler.Handle(new ApproveWithdrawalCommand
            {
                WithdrawalId = withdrawal.Id,
                Approve = false,
                RejectReason = "Invalid bank"
            }, CancellationToken.None);

            result.Code.Should().Be(200);
            withdrawal.Status.Should().Be(WithdrawalStatus.Rejected);
            withdrawal.RejectReason.Should().Be("Invalid bank");
            _paymentServiceMock.Verify(p => p.RecordTransactionAsync(It.IsAny<Wallet>(), FinancialTransactionType.Refund, It.IsAny<decimal>(),
                It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<string>()), Times.Never);
        }
    }

    public class ForceCompleteWithdrawalHandlerTests
    {
        private readonly Mock<IWithdrawalRequestRepository> _withdrawalRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly ForceCompleteWithdrawalHandler _handler;

        public ForceCompleteWithdrawalHandlerTests()
        {
            _withdrawalRepoMock = new Mock<IWithdrawalRequestRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _handler = new ForceCompleteWithdrawalHandler(_withdrawalRepoMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_NotFound_Returns404()
        {
            _withdrawalRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<WithdrawalRequest, bool>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IOrderedQueryable<WithdrawalRequest>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IIncludableQueryable<WithdrawalRequest, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<WithdrawalRequest>());
            var result = await _handler.Handle(new ForceCompleteWithdrawalCommand { WithdrawalId = Guid.NewGuid() }, CancellationToken.None);
            result.Code.Should().Be(404);
        }

        [Fact]
        public async Task Handle_InvalidStatus_Returns400()
        {
            _withdrawalRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<WithdrawalRequest, bool>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IOrderedQueryable<WithdrawalRequest>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IIncludableQueryable<WithdrawalRequest, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<WithdrawalRequest> { new WithdrawalRequest { Status = WithdrawalStatus.Pending } });
            var result = await _handler.Handle(new ForceCompleteWithdrawalCommand { WithdrawalId = Guid.NewGuid() }, CancellationToken.None);
            result.Code.Should().Be(400);
        }

        [Fact]
        public async Task Handle_Valid_Completes()
        {
            var withdrawal = new WithdrawalRequest { Id = Guid.NewGuid(), Status = WithdrawalStatus.Disputed };
            _withdrawalRepoMock.Setup(r => r.GetAsync(It.IsAny<Expression<Func<WithdrawalRequest, bool>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IOrderedQueryable<WithdrawalRequest>>>(), It.IsAny<Func<IQueryable<WithdrawalRequest>, IIncludableQueryable<WithdrawalRequest, object>>>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<WithdrawalRequest> { withdrawal });

            var result = await _handler.Handle(new ForceCompleteWithdrawalCommand { WithdrawalId = withdrawal.Id }, CancellationToken.None);

            result.Code.Should().Be(200);
            withdrawal.Status.Should().Be(WithdrawalStatus.Completed);
            _withdrawalRepoMock.Verify(r => r.Update(withdrawal), Times.Once);
        }
    }

    public class RepayShipperDebtHandlerTests
    {
        private readonly Mock<IMediator> _mediatorMock;
        private readonly RepayShipperDebtHandler _handler;

        public RepayShipperDebtHandlerTests()
        {
            _mediatorMock = new Mock<IMediator>();
            _handler = new RepayShipperDebtHandler(_mediatorMock.Object);
        }

        [Fact]
        public async Task Handle_DelegatesToRequestCodRemittance()
        {
            var userId = Guid.NewGuid();
            _mediatorMock
                .Setup(m => m.Send(It.IsAny<RequestCodRemittanceCommand>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(ApiResponse.Success(new { amount = 200_000m }, "ok"));

            var result = await _handler.Handle(new RepayShipperDebtCommand
            {
                CurrentUserId = userId,
                Amount = 200_000,
                Note = "test"
            }, CancellationToken.None);

            result.Code.Should().Be(200);
            _mediatorMock.Verify(m => m.Send(
                It.Is<RequestCodRemittanceCommand>(c =>
                    c.CurrentUserId == userId &&
                    c.Amount == 200_000 &&
                    c.Note == "test"),
                It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}