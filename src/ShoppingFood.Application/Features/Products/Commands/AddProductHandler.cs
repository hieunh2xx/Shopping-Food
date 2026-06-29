using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class AddProductHandler : IRequestHandler<AddProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AddProductHandler(
            IProductRepository productRepository, 
            IUserRepository userRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork, 
            IMapper mapper)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(AddProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = _mapper.Map<Product>(request);
                InitializeProduct(product); 

                AddImages(product, request.ImageUrls);
                AddToppings(product, request.ToppingIds);
                AddSizes(product, request.Sizes);

                _productRepository.Add(product);
                await _unitOfWork.SaveChangesAsync();

                // Send notification to all admin users
                var admins = await _userRepository.GetAsync(
                    predicate: u => u.Profile != null && u.Profile.Role == UserRole.Admin,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                );

                foreach (var admin in admins)
                {
                    var notification = new Notification
                    {
                        Id = Guid.NewGuid(),
                        UserId = admin.Id,
                        Title = "Yêu cầu duyệt món ăn mới",
                        Message = $"Món ăn mới '{product.ItemName}' đang chờ bạn phê duyệt.",
                        NotificationType = NotificationType.System,
                        IsRead = false,
                        CreateAt = DateTime.UtcNow
                    };
                    _notificationRepository.Add(notification);
                }
                await _unitOfWork.SaveChangesAsync();

                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Add product successfully");
            }
            catch (Exception ex) {
                await _unitOfWork.LogErrorAsync("AddProductHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void AddSizes(Product product, List<ProductSizeDto>? sizes)
        {
            if (sizes == null || !sizes.Any()) return;

            product.ProductSizes = new List<ProductSize>();
            foreach(var sizeDto in sizes)
            {
                var size = _mapper.Map<ProductSize>(sizeDto);
                size.Id = size.Id == Guid.Empty ? Guid.NewGuid() : size.Id;
                size.ProductId = product.Id;
                product.ProductSizes.Add(size);
            }
        }

        private void AddToppings(Product product, List<Guid>? toppingIds)
        {
            if(toppingIds == null || !toppingIds.Any()) return;

            product.ProductToppings = new List<ProductTopping>();
            foreach(var toppingId in toppingIds)
            {
                product.ProductToppings.Add(new ProductTopping
                {
                    ProductId = product.Id,
                    ToppingId = toppingId
                });
            }
        }

        private void AddImages(Product product, List<string>? imageUrls)
        {
            if (imageUrls == null || !imageUrls.Any()) return;

            product.Images = new List<ProductImage>();
            foreach(var url in imageUrls)
            {
                product.Images.Add(new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ImageUrl = url
                });
            }
        }

        private void InitializeProduct(Product product)
        {
            if(product.Id == Guid.Empty) product.Id = Guid.NewGuid();
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;
            product.Status = ProductStatus.Pending;
        }
    }
}
