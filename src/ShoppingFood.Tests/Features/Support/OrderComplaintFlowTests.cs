using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ShoppingFood.Application.Features.Coordinator.Commands;
using ShoppingFood.Application.Features.Support.Commands;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Implementations;
using Xunit;

namespace ShoppingFood.Tests.Features.Support
{
    /// <summary>
    /// Integration-style unit tests for the Order Complaint Flow:
    /// [TC-1] Customer submits order complaint - Success
    /// [TC-2] Customer submits order complaint - Failure (Order not delivered)
    /// [TC-3] Customer submits order complaint - Failure (Already complained)
    /// [TC-4] Customer submits order complaint - Failure (Deadline exceeded 24h)
    /// [TC-5] Coordinator resolves complaint with Warning - Success
    /// [TC-6] Coordinator escalates complaint to Admin for refund - Success
    /// [TC-7] Coordinator resolves complaint - Failure (Already resolved)
    /// </summary>
    public class OrderComplaintFlowTests : IDisposable
    {
        private readonly ShoppingFoodContext _dbContext;
        private readonly LogContext _logContext;
        private readonly UnitOfWork _unitOfWork;
        private readonly UserRepository _userRepository;
        private readonly OrderRepository _orderRepository;
        private readonly SystemReportRepository _systemReportRepository;
        private readonly NotificationRepository _notificationRepository;
        private readonly Mock<IPaymentSettlementService> _paymentSettlementServiceMock;

        public OrderComplaintFlowTests()
        {
            var dbOptions = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var logOptions = new DbContextOptionsBuilder<LogContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ShoppingFoodContext(dbOptions);
            _logContext = new LogContext(logOptions);

            _unitOfWork = new UnitOfWork(_dbContext, _logContext);
            _userRepository = new UserRepository(_dbContext);
            _orderRepository = new OrderRepository(_dbContext);
            _systemReportRepository = new SystemReportRepository(_dbContext);
            _notificationRepository = new NotificationRepository(_dbContext);
            _paymentSettlementServiceMock = new Mock<IPaymentSettlementService>();
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _logContext.Database.EnsureDeleted();
            _dbContext.Dispose();
            _logContext.Dispose();
            _unitOfWork.Dispose();
        }

        // ==============================================================
        // HELPER: Seed common test data
        // ==============================================================

        private async Task<(Guid customerAccountId, Guid customerProfileId, Guid orderId)> SeedCustomerAndDeliveredOrderAsync()
        {
            var customerAccountId = Guid.NewGuid();
            var customerProfileId = Guid.NewGuid();
            var orderId = Guid.NewGuid();

            var customerUser = new User
            {
                Id = customerAccountId,
                UserName = "customer_test",
                Phone = "0912345678",
                Profile = new UserProfile
                {
                    Id = customerProfileId,
                    Role = UserRole.Customer
                }
            };

            var order = new Order
            {
                Id = orderId,
                UserAccountId = customerAccountId,
                Status = OrderStatus.Delivered,
                UpdatedAt = DateTime.UtcNow.AddMinutes(-30), // delivered 30 minutes ago (within 24h)
                TotalAmount = 135000
            };

            _dbContext.Users.Add(customerUser);
            _dbContext.Orders.Add(order);
            await _dbContext.SaveChangesAsync();

            return (customerAccountId, customerProfileId, orderId);
        }

        private async Task<Guid> SeedCoordinatorAsync()
        {
            var coordAccountId = Guid.NewGuid();

            var coordUser = new User
            {
                Id = coordAccountId,
                UserName = "coordinator_test",
                Phone = "0900000001",
                Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    Role = UserRole.Coordinator
                }
            };

            _dbContext.Users.Add(coordUser);
            await _dbContext.SaveChangesAsync();

            return coordAccountId;
        }

        private async Task<Guid> SeedAdminAsync()
        {
            var adminAccountId = Guid.NewGuid();

            var adminUser = new User
            {
                Id = adminAccountId,
                UserName = "admin_test",
                Phone = "0900000002",
                Profile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    Role = UserRole.Admin
                }
            };

            _dbContext.Users.Add(adminUser);
            await _dbContext.SaveChangesAsync();

            return adminAccountId;
        }

        private SubmitOrderComplaintHandler CreateComplaintHandler()
        {
            return new SubmitOrderComplaintHandler(
                _userRepository,
                _orderRepository,
                _systemReportRepository,
                _notificationRepository,
                _unitOfWork
            );
        }

        private ResolveComplaintHandler CreateResolveHandler()
        {
            return new ResolveComplaintHandler(
                _systemReportRepository,
                new ShipperProfileRepository(_dbContext),
                _orderRepository,
                new RestaurantProfileRepository(_dbContext),
                _notificationRepository,
                new ShipperReputationHistoryRepository(_dbContext),
                _userRepository,
                _unitOfWork,
                _paymentSettlementServiceMock.Object
            );
        }

        // ==============================================================
        // [TC-1] Customer submits order complaint - Success
        // Flow: POST /api/support/order-complaint
        // Precondition: Order must be Delivered, within 24h, no prior complaint
        // Expected: 200 OK, SystemReport created with Pending status,
        //           Coordinator(s) receive notification
        // ==============================================================
        [Fact]
        public async Task TC1_Customer_SubmitOrderComplaint_Success()
        {
            // Arrange
            var (customerAccountId, _, orderId) = await SeedCustomerAndDeliveredOrderAsync();
            await SeedCoordinatorAsync(); // Coordinator exists to receive notification

            var handler = CreateComplaintHandler();
            var command = new SubmitOrderComplaintCommand
            {
                CurrentUserId = customerAccountId,
                OrderId = orderId,
                Reason = "Thiếu món trong đơn hàng",
                Description = "Đặt 3 món nhưng chỉ nhận được 2 món.",
                EvidenceImageUrl = "https://example.com/evidence.jpg"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeFalse();
            result.Code.Should().Be(200);
            result.Message.Should().Be("Your complaint has been submitted successfully. Our team will review it within 24 hours.");

            // Verify SystemReport was created in DB
            var report = await _dbContext.SystemReports.FirstOrDefaultAsync(r => r.TargetId == orderId);
            report.Should().NotBeNull();
            report!.Status.Should().Be(ReportStatus.Pending);
            report.TargetType.Should().Be(ReportTargetType.Order);
            report.Title.Should().Be("Thiếu món trong đơn hàng");

            // Verify Coordinator received notification
            var coordinatorNotif = await _dbContext.Notifications.FirstOrDefaultAsync(n => n.Title == "Khiếu nại đơn hàng mới");
            coordinatorNotif.Should().NotBeNull();
        }

        // ==============================================================
        // [TC-2] Customer submits complaint - Failure (Order not Delivered)
        // Expected: 400 - "You can only submit a complaint for a delivered order."
        // ==============================================================
        [Fact]
        public async Task TC2_Customer_SubmitOrderComplaint_Failure_OrderNotDelivered()
        {
            // Arrange
            var customerAccountId = Guid.NewGuid();
            var orderId = Guid.NewGuid();

            var customer = new User
            {
                Id = customerAccountId,
                UserName = "customer_pending",
                Phone = "0911111111",
                Profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Customer }
            };

            var pendingOrder = new Order
            {
                Id = orderId,
                UserAccountId = customerAccountId,
                Status = OrderStatus.Pending, // NOT delivered
                UpdatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(customer);
            _dbContext.Orders.Add(pendingOrder);
            await _dbContext.SaveChangesAsync();

            var handler = CreateComplaintHandler();
            var command = new SubmitOrderComplaintCommand
            {
                CurrentUserId = customerAccountId,
                OrderId = orderId,
                Reason = "Thiếu món",
                EvidenceImageUrl = "https://example.com/evidence.jpg"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("You can only submit a complaint for a delivered order.");
        }

        // ==============================================================
        // [TC-3] Customer submits complaint - Failure (Already complained)
        // Expected: 400 - "A complaint has already been submitted for this order."
        // ==============================================================
        [Fact]
        public async Task TC3_Customer_SubmitOrderComplaint_Failure_AlreadyComplained()
        {
            // Arrange
            var (customerAccountId, customerProfileId, orderId) = await SeedCustomerAndDeliveredOrderAsync();

            // Pre-existing complaint
            var existingReport = new SystemReport
            {
                Id = Guid.NewGuid(),
                ReporterId = customerProfileId,
                TargetId = orderId,
                TargetType = ReportTargetType.Order,
                Title = "Thiếu món",
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.SystemReports.Add(existingReport);
            await _dbContext.SaveChangesAsync();

            var handler = CreateComplaintHandler();
            var command = new SubmitOrderComplaintCommand
            {
                CurrentUserId = customerAccountId,
                OrderId = orderId,
                Reason = "Thiếu món lần 2",
                EvidenceImageUrl = "https://example.com/evidence2.jpg"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("A complaint has already been submitted for this order.");
        }

        // ==============================================================
        // [TC-4] Customer submits complaint - Failure (Deadline exceeded 24h)
        // Expected: 400 - "Complaint must be submitted within 24 hours..."
        // ==============================================================
        [Fact]
        public async Task TC4_Customer_SubmitOrderComplaint_Failure_DeadlinePassed()
        {
            // Arrange
            var customerAccountId = Guid.NewGuid();
            var orderId = Guid.NewGuid();

            var customer = new User
            {
                Id = customerAccountId,
                UserName = "customer_late",
                Phone = "0922222222",
                Profile = new UserProfile { Id = Guid.NewGuid(), Role = UserRole.Customer }
            };

            var oldDeliveredOrder = new Order
            {
                Id = orderId,
                UserAccountId = customerAccountId,
                Status = OrderStatus.Delivered,
                UpdatedAt = DateTime.UtcNow.AddHours(-25) // Delivered 25 hours ago → past deadline
            };

            _dbContext.Users.Add(customer);
            _dbContext.Orders.Add(oldDeliveredOrder);
            await _dbContext.SaveChangesAsync();

            var handler = CreateComplaintHandler();
            var command = new SubmitOrderComplaintCommand
            {
                CurrentUserId = customerAccountId,
                OrderId = orderId,
                Reason = "Đồ ăn không ngon",
                EvidenceImageUrl = "https://example.com/late-evidence.jpg"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("Complaint must be submitted within 24 hours after delivery. The deadline has passed.");
        }

        // ==============================================================
        // [TC-5] Coordinator resolves complaint with Warning - Success
        // Flow:  Customer submits → Coordinator chooses "Warning" (no refund)
        // Expected: Report status → Resolved, Customer gets result notification
        // ==============================================================
        [Fact]
        public async Task TC5_Coordinator_ResolveComplaint_Warning_Success()
        {
            // Arrange
            var (customerAccountId, customerProfileId, orderId) = await SeedCustomerAndDeliveredOrderAsync();

            var reportId = Guid.NewGuid();
            var report = new SystemReport
            {
                Id = reportId,
                ReporterId = customerProfileId,
                TargetId = orderId,
                TargetType = ReportTargetType.Order,
                Title = "Đồ ăn không đúng mô tả",
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                // Navigation property is needed for NotifyReporter
                Reporter = new UserProfile
                {
                    Id = customerProfileId,
                    Role = UserRole.Customer,
                    UserAccountId = customerAccountId,
                    UserAccount = new User { Id = customerAccountId, UserName = "customer_test", Phone = "0912345678" }
                }
            };
            _dbContext.SystemReports.Add(report);
            await _dbContext.SaveChangesAsync();

            var coordAccountId = Guid.NewGuid();
            var handler = CreateResolveHandler();
            var command = new ResolveComplaintCommand
            {
                CurrentUserId = coordAccountId,
                ReportId = reportId,
                ResolutionType = ComplaintResolutionType.Warning,
                Notes = "Nhà hàng đã nhận cảnh cáo về chất lượng sản phẩm."
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeFalse();
            result.Code.Should().Be(200);
            result.Message.Should().Be("Complaint resolved.");

            // Verify report status changed to Resolved
            var updatedReport = await _dbContext.SystemReports.FindAsync(reportId);
            updatedReport!.Status.Should().Be(ReportStatus.Resolved);

            // Verify Customer received outcome notification
            var customerNotif = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.UserId == customerAccountId && n.Title == "Kết quả xử lý khiếu nại");
            customerNotif.Should().NotBeNull();
            customerNotif!.Message.Should().Contain("Cảnh cáo");
        }

        // ==============================================================
        // [TC-6] Coordinator escalates complaint to Admin for refund - Success
        // Flow:  Customer submits → Coordinator chooses "EscalateToAdmin"
        // Expected: Report status → Escalated,
        //           Admin receives notification to process refund,
        //           Customer does NOT receive notification yet
        // ==============================================================
        [Fact]
        public async Task TC6_Coordinator_EscalateComplaintToAdmin_ForRefund_Success()
        {
            // Arrange
            var (customerAccountId, customerProfileId, orderId) = await SeedCustomerAndDeliveredOrderAsync();
            var adminAccountId = await SeedAdminAsync();

            var reportId = Guid.NewGuid();
            var report = new SystemReport
            {
                Id = reportId,
                ReporterId = customerProfileId,
                TargetId = orderId,
                TargetType = ReportTargetType.Order,
                Title = "Giao sai đơn hoàn toàn, cần hoàn tiền",
                Status = ReportStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Reporter = new UserProfile
                {
                    Id = customerProfileId,
                    Role = UserRole.Customer,
                    UserAccountId = customerAccountId,
                    UserAccount = new User { Id = customerAccountId, UserName = "customer_test", Phone = "0912345678" }
                }
            };
            _dbContext.SystemReports.Add(report);
            await _dbContext.SaveChangesAsync();

            var coordAccountId = Guid.NewGuid();
            var handler = CreateResolveHandler();
            var command = new ResolveComplaintCommand
            {
                CurrentUserId = coordAccountId,
                ReportId = reportId,
                ResolutionType = ComplaintResolutionType.EscalateToAdmin,
                Notes = "Khiếu nại phức tạp, cần Admin xem xét và hoàn tiền cho khách."
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeFalse();
            result.Code.Should().Be(200);
            result.Message.Should().Be("Complaint escalated to Admin.");

            // Verify report status changed to Escalated (NOT Resolved)
            var updatedReport = await _dbContext.SystemReports.FindAsync(reportId);
            updatedReport!.Status.Should().Be(ReportStatus.Escalated);

            // Verify Admin received escalation notification
            var adminNotif = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.UserId == adminAccountId && n.Title.Contains("Điều phối viên"));
            adminNotif.Should().NotBeNull();
            adminNotif!.Message.Should().Contain("Khiếu nại phức tạp, cần Admin xem xét và hoàn tiền cho khách.");

            // Verify Customer did NOT receive any notification (escalation is internal)
            var customerNotif = await _dbContext.Notifications
                .FirstOrDefaultAsync(n => n.UserId == customerAccountId && n.Title == "Kết quả xử lý khiếu nại");
            customerNotif.Should().BeNull();
        }

        // ==============================================================
        // [TC-7] Coordinator resolves complaint - Failure (Already resolved)
        // Expected: 400 - "This complaint has already been processed."
        // ==============================================================
        [Fact]
        public async Task TC7_Coordinator_ResolveComplaint_Failure_AlreadyResolved()
        {
            // Arrange
            var (_, customerProfileId, orderId) = await SeedCustomerAndDeliveredOrderAsync();

            var reportId = Guid.NewGuid();
            var resolvedReport = new SystemReport
            {
                Id = reportId,
                ReporterId = customerProfileId,
                TargetId = orderId,
                TargetType = ReportTargetType.Order,
                Title = "Đơn hàng đã xử lý",
                Status = ReportStatus.Resolved, // Already resolved
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.SystemReports.Add(resolvedReport);
            await _dbContext.SaveChangesAsync();

            var coordAccountId = Guid.NewGuid();
            var handler = CreateResolveHandler();
            var command = new ResolveComplaintCommand
            {
                CurrentUserId = coordAccountId,
                ReportId = reportId,
                ResolutionType = ComplaintResolutionType.Warning,
                Notes = "Cố giải quyết lại lần 2"
            };

            // Act
            var result = await handler.Handle(command, CancellationToken.None);

            // Assert
            result.Error.Should().BeTrue();
            result.Code.Should().Be(400);
            result.Message.Should().Be("This complaint has already been processed.");
        }
    }
}
