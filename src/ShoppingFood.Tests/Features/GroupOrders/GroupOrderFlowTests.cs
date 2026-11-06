using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using ShoppingFood.Application.Features.GroupOrders;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Application.Services;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.GroupOrders;

namespace ShoppingFood.Tests.Features.GroupOrders
{
    /// <summary>End-to-end gom đơn flow on EF InMemory: create → join → add items → prepay → submit / cancel.</summary>
    public class GroupOrderFlowTests : IDisposable
    {
        private const decimal StartBalance = 200_000m;
        private const decimal ItemPrice = 45_000m;

        private readonly ShoppingFoodContext _db;
        private readonly GroupOrderManager _manager;
        private readonly WalletSettlementFake _settlement;
        private readonly IUnitOfWork _uow = Mock.Of<IUnitOfWork>();
        private readonly Guid _campusId = Guid.NewGuid();
        private readonly Guid _buildingId = Guid.NewGuid();
        private readonly Guid _restaurantId = Guid.NewGuid();
        private readonly Guid _productId = Guid.NewGuid();
        private readonly Guid _categoryId = Guid.NewGuid();
        private readonly List<Guid> _users = new();

        public GroupOrderFlowTests()
        {
            var options = new DbContextOptionsBuilder<ShoppingFoodContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;
            _db = new ShoppingFoodContext(options);
            _settlement = new WalletSettlementFake(_db);
            _manager = new GroupOrderManager(_db, _settlement);
            Seed();
        }

        public void Dispose() => _db.Dispose();

        private void Seed()
        {
            _db.Campuses.Add(new Campus
            {
                Id = _campusId, Code = "TEST", Name = "Test Campus", ShortName = "TC", Address = "Somewhere",
                MinGroupMembers = 3, MaxGroupMembers = 10, GroupBaseShippingFee = 15_000m,
                LobbySurchargePerMember = 3_000m, RoomSurchargePerMember = 8_000m, SingleRoomDeliveryFee = 25_000m
            });
            _db.CampusBuildings.Add(new CampusBuilding
            {
                Id = _buildingId, CampusId = _campusId, Code = "DOM-A", Name = "KTX Dom A", ShortName = "Dom A",
                BuildingType = CampusBuildingType.Dormitory, AllowRoomDelivery = true, MapX = 10, MapY = 10
            });

            var ownerUserId = Guid.NewGuid();
            var ownerProfileId = Guid.NewGuid();
            _db.Users.Add(new User { Id = ownerUserId, UserName = "owner", Phone = "0900000000" });
            _db.UserProfiles.Add(new UserProfile { Id = ownerProfileId, UserAccountId = ownerUserId, FullName = "Chủ quán", Role = UserRole.Seller });
            _db.RestaurantProfiles.Add(new RestaurantProfile
            {
                Id = _restaurantId, OwnerId = ownerProfileId, RestaurantName = "Cơm tấm 7Q", Address = "FPT",
                Status = RestaurantStatus.Active, DeliveryType = DeliveryType.PlatformDelivery
            });
            _db.MenuCategories.Add(new MenuCategory { Id = _categoryId, RestaurantId = _restaurantId, Title = "Cơm" });
            _db.Products.Add(new Product
            {
                Id = _productId, RestaurantId = _restaurantId, ItemName = "Cơm tấm sườn", Price = ItemPrice,
                Status = ProductStatus.Approved, StockStatus = StockStatus.InStock, CategoryId = _categoryId
            });

            for (var i = 1; i <= 4; i++)
            {
                var id = Guid.NewGuid();
                _users.Add(id);
                _db.Users.Add(new User { Id = id, UserName = $"sv{i}", Phone = $"098800000{i}" });
                _db.UserProfiles.Add(new UserProfile { Id = Guid.NewGuid(), UserAccountId = id, FullName = $"Sinh viên {i}", Role = UserRole.Customer });
                _db.Wallets.Add(new Wallet { Id = Guid.NewGuid(), OwnerType = WalletOwnerType.Customer, OwnerId = id, Balance = StartBalance });
            }
            _db.SaveChanges();
        }

        private decimal Balance(Guid userId) => _db.Wallets.Single(w => w.OwnerId == userId).Balance;

        private List<GroupOrderItemInput> OneDish() => new() { new GroupOrderItemInput { ProductId = _productId, Quantity = 1 } };

        private CreateGroupOrderCommand CreateCommand(List<GroupOrderItemInput>? items = null, bool fromCart = false) => new()
        {
            CurrentUserId = _users[0], CampusId = _campusId, BuildingId = _buildingId, RestaurantId = _restaurantId,
            DeliveryMode = "Room", PaymentMode = "Individual", RoomNumber = "A101", DurationMinutes = 30,
            Items = items, FromCart = fromCart
        };

        private async Task<GroupOrderDetailDto> CreateRoomWithMembersAsync(int members)
        {
            var create = await new CreateGroupOrderHandler(_db, _manager, _uow).Handle(CreateCommand(OneDish()), default);
            create.Code.Should().Be(200, create.Message);
            var group = (GroupOrderDetailDto)create.Data!;

            for (var i = 1; i < members; i++)
            {
                var join = await new JoinGroupOrderHandler(_db, _manager, _uow).Handle(new JoinGroupOrderCommand
                {
                    CurrentUserId = _users[i], GroupOrderId = group.Id, RoomNumber = $"A10{i + 1}", Items = OneDish()
                }, default);
                join.Code.Should().Be(200, join.Message);
            }

            return group;
        }

        [Fact]
        public async Task Create_WithoutAnyDish_IsRejected()
        {
            var create = await new CreateGroupOrderHandler(_db, _manager, _uow).Handle(CreateCommand(), default);

            create.Code.Should().Be(400);
            (await _db.GroupOrders.CountAsync()).Should().Be(0);
        }

        [Fact]
        public async Task Create_FromCart_MovesRestaurantCartItemsIntoHostPortion()
        {
            var cart = new Cart { Id = Guid.NewGuid(), UserAccountId = _users[0] };
            cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = _productId, Quantity = 2, PriceAtAdded = ItemPrice });
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();

            var create = await new CreateGroupOrderHandler(_db, _manager, _uow).Handle(CreateCommand(fromCart: true), default);

            create.Code.Should().Be(200, create.Message);
            var detail = (GroupOrderDetailDto)create.Data!;
            detail.Members.Single().Items.Single().Quantity.Should().Be(2);
            (await _db.CartItems.CountAsync()).Should().Be(0);
        }

        private Guid AddProduct(string name, StockStatus stock)
        {
            var id = Guid.NewGuid();
            _db.Products.Add(new Product
            {
                Id = id, RestaurantId = _restaurantId, ItemName = name, Price = 30_000m,
                Status = ProductStatus.Approved, StockStatus = stock, CategoryId = _categoryId
            });
            _db.SaveChanges();
            return id;
        }

        [Fact]
        public async Task Menu_HidesDishesThatStoppedSelling()
        {
            AddProduct("Trà sữa hết hàng", StockStatus.OutOfStock);

            var res = await new GetGroupOrderMenuHandler(_db).Handle(new GetGroupOrderMenuQuery { RestaurantId = _restaurantId }, default);

            var menu = (List<GroupOrderMenuItemDto>)res.Data!;
            menu.Select(m => m.ItemName).Should().BeEquivalentTo(new[] { "Cơm tấm sườn" });
        }

        [Fact]
        public async Task Create_FromCart_SkipsStoppedDishesAndKeepsThemInCart()
        {
            var stoppedId = AddProduct("Trà sữa hết hàng", StockStatus.OutOfStock);
            var cart = new Cart { Id = Guid.NewGuid(), UserAccountId = _users[0] };
            cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = _productId, Quantity = 1, PriceAtAdded = ItemPrice });
            cart.Items.Add(new CartItem { Id = Guid.NewGuid(), CartId = cart.Id, ProductId = stoppedId, Quantity = 1, PriceAtAdded = 30_000m });
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();

            var create = await new CreateGroupOrderHandler(_db, _manager, _uow).Handle(CreateCommand(fromCart: true), default);

            create.Code.Should().Be(200, create.Message);
            ((GroupOrderDetailDto)create.Data!).Members.Single().Items.Should().ContainSingle(i => i.ProductId == _productId);
            (await _db.CartItems.SingleAsync()).ProductId.Should().Be(stoppedId);
        }

        [Fact]
        public async Task Join_WithoutAnyDish_IsRejected()
        {
            var group = await CreateRoomWithMembersAsync(1);
            var join = await new JoinGroupOrderHandler(_db, _manager, _uow).Handle(
                new JoinGroupOrderCommand { CurrentUserId = _users[1], GroupOrderId = group.Id, RoomNumber = "A102" }, default);

            join.Code.Should().Be(400);
        }

        private async Task PayAllIndividuallyAsync(Guid groupId, int members)
        {
            for (var i = 0; i < members; i++)
            {
                var pay = await new PayGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                    new PayGroupOrderCommand { CurrentUserId = _users[i], GroupOrderId = groupId }, default);
                pay.Code.Should().Be(200, pay.Message);
            }
        }

        [Fact]
        public async Task Submit_FourMembers_CreatesPaidOrderAndRefundsShippingDifference()
        {
            var group = await CreateRoomWithMembersAsync(4);
            await PayAllIndividuallyAsync(group.Id, 4);

            // Prepaid at the 3-person rate: 45k + (5k + 8k) = 58k each
            Balance(_users[1]).Should().Be(StartBalance - 58_000m);

            var submit = await new SubmitGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new SubmitGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id }, default);
            submit.Code.Should().Be(200, submit.Message);

            // Final share with 4 people: ceil(3,750 → 4,000) + 8,000 = 12,000 → 1k refunded each
            foreach (var user in _users)
                Balance(user).Should().Be(StartBalance - 57_000m);

            var stored = await _db.GroupOrders.Include(g => g.Members).SingleAsync(g => g.Id == group.Id);
            stored.Status.Should().Be(GroupOrderStatus.Submitted);
            stored.OrderId.Should().NotBeNull();

            var order = await _db.Orders.Include(o => o.Items).SingleAsync(o => o.Id == stored.OrderId);
            order.PaymentMethod.Should().Be(PaymentMethod.SystemWallet);
            order.PaymentStatus.Should().Be(PaymentStatus.Paid);
            order.ShippingFee.Should().Be(48_000m);
            order.ShipperIncome.Should().Be(48_000m);
            order.TotalAmount.Should().Be(4 * 57_000m);
            order.Items.Should().HaveCount(4);
            order.Items.Should().OnlyContain(i => i.ItemName.StartsWith("[P.A10"));
            order.Note.Should().Contain(stored.Code);
        }

        private async Task<(Guid OrderId, Guid GroupId)> SubmitThreePersonGroupAsync()
        {
            var group = await CreateRoomWithMembersAsync(3);
            await PayAllIndividuallyAsync(group.Id, 3);
            var submit = await new SubmitGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new SubmitGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id }, default);
            submit.Code.Should().Be(200, submit.Message);
            var stored = await _db.GroupOrders.SingleAsync(g => g.Id == group.Id);
            return (stored.OrderId!.Value, group.Id);
        }

        private (Guid UserId, Guid ShipperId) AddShipper(string name)
        {
            var userId = Guid.NewGuid();
            var profileId = Guid.NewGuid();
            var shipperId = Guid.NewGuid();
            _db.Users.Add(new User { Id = userId, UserName = name });
            _db.UserProfiles.Add(new UserProfile { Id = profileId, UserAccountId = userId, FullName = name, Role = UserRole.Shipper });
            _db.ShipperProfiles.Add(new ShipperProfile { Id = shipperId, UserProfileId = profileId, ShipperApplicationId = Guid.NewGuid() });
            _db.SaveChanges();
            return (userId, shipperId);
        }

        [Fact]
        public async Task Restaurant_SeesPortionsWithoutPhones()
        {
            var (orderId, _) = await SubmitThreePersonGroupAsync();
            var ownerUserId = _db.UserProfiles.Single(p => p.Role == UserRole.Seller).UserAccountId;

            var res = await new GetGroupOrdersForOrdersHandler(_db).Handle(
                new GetGroupOrdersForOrdersQuery { CurrentUserId = ownerUserId, OrderIds = new() { orderId } }, default);

            var info = ((List<GroupOrderForOrderDto>)res.Data!).Single();
            info.PortionCount.Should().Be(3);
            info.Portions.Select(p => p.RoomNumber).Should().BeEquivalentTo(new[] { "A101", "A102", "A103" });
            info.Portions.Should().OnlyContain(p => p.Phone == null);
            info.CanMarkDelivered.Should().BeFalse();
        }

        [Fact]
        public async Task AssignedShipper_MarksPortionDelivered_OtherShipperIsForbidden()
        {
            var (orderId, groupId) = await SubmitThreePersonGroupAsync();
            var (shipperUser, shipperId) = AddShipper("shipper1");
            var (otherUser, _) = AddShipper("shipper2");
            var order = await _db.Orders.SingleAsync(o => o.Id == orderId);
            order.ShipperId = shipperId;
            order.Status = OrderStatus.Shipping;
            await _db.SaveChangesAsync();

            var view = await new GetGroupOrdersForOrdersHandler(_db).Handle(
                new GetGroupOrdersForOrdersQuery { CurrentUserId = shipperUser, OrderIds = new() { orderId } }, default);
            var info = ((List<GroupOrderForOrderDto>)view.Data!).Single();
            info.CanMarkDelivered.Should().BeTrue();
            info.Portions.Should().OnlyContain(p => p.Phone != null);

            var handler = new MarkGroupPortionDeliveredHandler(_db, _manager);
            var forbidden = await handler.Handle(new MarkGroupPortionDeliveredCommand
            {
                CurrentUserId = otherUser, GroupOrderId = groupId, MemberId = info.Portions[0].MemberId
            }, default);
            forbidden.Code.Should().Be(403);

            var ok = await handler.Handle(new MarkGroupPortionDeliveredCommand
            {
                CurrentUserId = shipperUser, GroupOrderId = groupId, MemberId = info.Portions[0].MemberId
            }, default);
            ok.Code.Should().Be(200, ok.Message);
            ((GroupOrderForOrderDto)ok.Data!).DeliveredCount.Should().Be(1);
        }

        [Fact]
        public async Task Submit_WhenSomeoneHasNotPaid_IsBlocked()
        {
            var group = await CreateRoomWithMembersAsync(3);
            await new PayGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new PayGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id }, default);

            var submit = await new SubmitGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new SubmitGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id }, default);

            submit.Code.Should().Be(400);
            submit.Message.Should().Contain("chưa thanh toán");
        }

        [Fact]
        public async Task HostPaysAll_ThenCancel_RefundsHostWallet()
        {
            var group = await CreateRoomWithMembersAsync(3);

            var payAll = await new PayGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new PayGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id, ForAll = true }, default);
            payAll.Code.Should().Be(200, payAll.Message);
            Balance(_users[0]).Should().Be(StartBalance - 3 * 58_000m);
            Balance(_users[1]).Should().Be(StartBalance);

            var cancel = await new CancelGroupOrderHandler(_db, _manager, _uow).Handle(
                new CancelGroupOrderCommand { CurrentUserId = _users[0], GroupOrderId = group.Id, Reason = "test" }, default);
            cancel.Code.Should().Be(200, cancel.Message);

            Balance(_users[0]).Should().Be(StartBalance);
            (await _db.GroupOrders.SingleAsync(g => g.Id == group.Id)).Status.Should().Be(GroupOrderStatus.Cancelled);
        }

        [Fact]
        public async Task PaidMember_CannotEditItems_UntilUnpay()
        {
            var group = await CreateRoomWithMembersAsync(3);
            await new PayGroupOrderHandler(_db, _manager, _uow, _settlement).Handle(
                new PayGroupOrderCommand { CurrentUserId = _users[1], GroupOrderId = group.Id }, default);

            var add = await new AddGroupOrderItemHandler(_db, _manager, _uow).Handle(
                new AddGroupOrderItemCommand { CurrentUserId = _users[1], GroupOrderId = group.Id, ProductId = _productId, Quantity = 1 }, default);
            add.Code.Should().Be(400);

            var unpay = await new UnpayGroupOrderHandler(_db, _manager, _uow).Handle(
                new UnpayGroupOrderCommand { CurrentUserId = _users[1], GroupOrderId = group.Id }, default);
            unpay.Code.Should().Be(200, unpay.Message);
            Balance(_users[1]).Should().Be(StartBalance);
        }

        [Fact]
        public async Task Join_RoomDelivery_RequiresRoomNumber()
        {
            var group = await CreateRoomWithMembersAsync(1);
            var join = await new JoinGroupOrderHandler(_db, _manager, _uow).Handle(
                new JoinGroupOrderCommand { CurrentUserId = _users[1], GroupOrderId = group.Id, Items = OneDish() }, default);
            join.Code.Should().Be(400);
        }

        [Fact]
        public async Task AddItem_FromAnotherRestaurant_IsRejected()
        {
            var group = await CreateRoomWithMembersAsync(1);
            var otherProduct = new Product
            {
                Id = Guid.NewGuid(), RestaurantId = Guid.NewGuid(), ItemName = "Trà sữa", Price = 30_000m,
                Status = ProductStatus.Approved, StockStatus = StockStatus.InStock, CategoryId = Guid.NewGuid(),
                Restaurant = new RestaurantProfile { Id = Guid.NewGuid(), RestaurantName = "Quán khác", Status = RestaurantStatus.Active }
            };
            otherProduct.RestaurantId = otherProduct.Restaurant.Id;
            _db.Products.Add(otherProduct);
            await _db.SaveChangesAsync();

            var add = await new AddGroupOrderItemHandler(_db, _manager, _uow).Handle(
                new AddGroupOrderItemCommand { CurrentUserId = _users[0], GroupOrderId = group.Id, ProductId = otherProduct.Id, Quantity = 1 }, default);

            add.Code.Should().Be(400);
            add.Message.Should().Contain("cùng một quán");
        }

        /// <summary>Wallet-only stand-in for PaymentSettlementService backed by the same DbContext.</summary>
        private sealed class WalletSettlementFake : IPaymentSettlementService
        {
            private readonly ShoppingFoodContext _db;
            public WalletSettlementFake(ShoppingFoodContext db) => _db = db;

            public Task<PlatformFinanceConfig> GetConfigAsync() => Task.FromResult(new PlatformFinanceConfig { CommissionRate = 0.1m });

            public (decimal ItemsSubtotal, decimal PlatformCommission, decimal SellerPayout, decimal ShipperEarning) CalculateSplit(
                decimal totalAmount, decimal shippingFee, decimal shipperIncome, decimal commissionRate, bool isSelfDelivery = false, decimal? preservedItemsSubtotal = null)
            {
                var food = totalAmount - shippingFee;
                var commission = Math.Round(food * commissionRate, 0);
                return (preservedItemsSubtotal ?? food, commission, food - commission, shipperIncome);
            }

            public async Task<Wallet> GetOrCreateWalletAsync(WalletOwnerType ownerType, Guid ownerId)
                => await _db.Wallets.SingleAsync(w => w.OwnerType == ownerType && w.OwnerId == ownerId);

            public Task RecordTransactionAsync(Wallet wallet, FinancialTransactionType type, decimal amount, string description, Guid? referenceId = null, string? referenceType = null)
            {
                wallet.Balance += amount;
                return Task.CompletedTask;
            }

            public decimal ResolveCommissionRate(decimal globalRate, decimal? customRatePercent) => customRatePercent.HasValue ? customRatePercent.Value / 100m : globalRate;

            public Task<PaymentSession?> CreateTopUpSessionAsync(Guid userId, decimal amount) => throw new NotSupportedException();
            public Task<string?> ProcessCheckoutPaymentAsync(Order order, Guid? userId, string? cardLastFour = null, string? cardBrand = null, EWalletProvider? provider = null) => throw new NotSupportedException();
            public Task SettleOrderOnDeliveryAsync(Order order, ShipperProfile shipper) => throw new NotSupportedException();
            public Task SettleSelfDeliveryOrderAsync(Order order) => throw new NotSupportedException();
            public Task<string?> ProcessRefundAsync(Order order) => throw new NotSupportedException();
            public Task ConfirmPaymentSessionAsync(Guid sessionId) => throw new NotSupportedException();
            public Task<bool> ConfirmPaymentSessionByInvoiceAsync(string invoiceNumber, decimal? paidAmount = null, string? externalTransactionId = null, bool allowExpired = false) => throw new NotSupportedException();
            public Task ChargeSellerMaintenanceFeeAsync(Guid restaurantId, string description) => throw new NotSupportedException();
            public Task ProcessDueMaintenanceFeesAsync() => throw new NotSupportedException();
        }
    }
}
