using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveProductHandler : IRequestHandler<ApproveProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;
        private readonly INotificationRepository _notificationRepository;
        private readonly ShoppingFoodContext _dbContext;

        public ApproveProductHandler(
            IProductRepository productRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IEmailService emailService,
            INotificationRepository notificationRepository,
            ShoppingFoodContext dbContext)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _emailService = emailService;
            _notificationRepository = notificationRepository;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(ApproveProductCommand request, CancellationToken cancellationToken)
        {
            using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                if (!request.CurrentUserId.HasValue)
                    return ApiResponse.Failure(401, "User is unauthorized.");

                if (!await IsAdminUserAsync(request.CurrentUserId.Value))
                    return ApiResponse.Failure(403, "Forbidden. Only administrator can review products.");

                var products = await _productRepository.GetAsync(
                    predicate: p => p.Id == request.ProductId,
                    include: q => q.Include(p => p.Restaurant)
                                   .ThenInclude(r => r.Owner)
                                   .ThenInclude(o => o.UserAccount),
                    disableTracking: false
                );
                var product = products.FirstOrDefault();

                if (product == null)
                    return ApiResponse.Failure(404, $"Product with ID '{request.ProductId}' was not found.");

                UpdateProductStatus(product, request.IsApproved);
                _productRepository.Update(product);

                AddDbNotification(product, request.IsApproved);

                await _unitOfWork.SaveChangesAsync();

                await SendEmailNotificationAsync(product, request.IsApproved);

                await transaction.CommitAsync(cancellationToken);

                var productDto = _mapper.Map<ProductDto>(product);
                string statusMessage = request.IsApproved 
                    ? "Product has been approved successfully."
                    : "Product has been rejected.";

                return ApiResponse.Success(productDto, statusMessage);
            }
            catch (Exception ex)
            {
                
                await transaction.RollbackAsync(cancellationToken);
                
                await _unitOfWork.LogErrorAsync("ApproveProductHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred (transaction rolled back): {ex.Message}");
            }
        }

        private async Task<bool> IsAdminUserAsync(Guid userId)
        {
            var adminUser = await _userRepository.GetAsync(
                predicate: u => u.Id == userId,
                include: q => q.Include(u => u.Profile)
            );
            var admin = adminUser.FirstOrDefault();
            return admin?.Profile != null && admin.Profile.Role == UserRole.Admin;
        }

        private void UpdateProductStatus(Product product, bool isApproved)
        {
            if (isApproved)
            {
                product.Status = ProductStatus.Approved;
                product.IsHidden = false;
            }
            else
            {
                product.Status = ProductStatus.Rejected;
            }
            product.UpdatedAt = DateTime.UtcNow;
        }

        private async Task SendEmailNotificationAsync(Product product, bool isApproved)
        {
            var ownerEmail = product.Restaurant?.Owner?.UserAccount?.Email;
            if (!string.IsNullOrEmpty(ownerEmail))
            {
                string subject = isApproved
                    ? "Sản phẩm của bạn đã được phê duyệt"
                    : "Sản phẩm của bạn đã bị từ chối";

                string body = isApproved
                    ? $"<p>Xin chào,</p><p>Sản phẩm <strong>{product.ItemName}</strong> thuộc cửa hàng <strong>{product.Restaurant?.RestaurantName}</strong> đã được quản trị viên duyệt thành công và hiển thị trên cửa hàng.</p>"
                    : $"<p>Xin chào,</p><p>Sản phẩm <strong>{product.ItemName}</strong> thuộc cửa hàng <strong>{product.Restaurant?.RestaurantName}</strong> đã bị từ chối phê duyệt.</p>";

                await _emailService.SendEmailAsync(ownerEmail, subject, body);
            }
        }

        private void AddDbNotification(Product product, bool isApproved)
        {
            var ownerUserAccountId = product.Restaurant?.Owner?.UserAccountId;
            if (ownerUserAccountId.HasValue)
            {
                var notification = new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = ownerUserAccountId.Value,
                    Title = isApproved ? "Sản phẩm đã được phê duyệt" : "Sản phẩm bị từ chối",
                    Message = isApproved
                        ? $"Sản phẩm '{product.ItemName}' của cửa hàng '{product.Restaurant?.RestaurantName}' đã được phê duyệt."
                        : $"Sản phẩm '{product.ItemName}' của cửa hàng '{product.Restaurant?.RestaurantName}' đã bị từ chối.",
                    NotificationType = null,
                    IsRead = false,
                    CreateAt = DateTime.UtcNow
                };

                _notificationRepository.Add(notification);
            }
        }
    }
}
