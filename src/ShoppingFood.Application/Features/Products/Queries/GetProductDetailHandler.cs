using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Products.Queries
{
    public class GetProductDetailHandler : IRequestHandler<GetProductDetailQuery, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IFlashSaleProductRepository _flashSaleProductRepository;

        public GetProductDetailHandler(
            IProductRepository productRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IFlashSaleProductRepository flashSaleProductRepository)
        {
            _productRepository = productRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _flashSaleProductRepository = flashSaleProductRepository;
        }

        public async Task<ApiResponse> Handle(GetProductDetailQuery request, CancellationToken cancellationToken)
        {
            var products = await _productRepository.GetAsync(
                predicate: p => p.Id == request.Id,
                include: q => q.IgnoreQueryFilters().Include(p => p.Restaurant)
                               .Include(p => p.Images)
                               .Include(p => p.Category)
                               .Include(p => p.ProductToppings)
                                   .ThenInclude(pt => pt.Topping)
                               .Include(p => p.ProductSizes)
                               .Include(p => p.Reviews),
                disableTracking: true
            );

            var product = products.FirstOrDefault();

            if (product == null)
            {
                return ApiResponse.Failure(404, "Product was not found.");
            }

          
            if (product.Status != ProductStatus.Pending && product.Status != ProductStatus.Approved)
            {
                bool isOwner = false;
                if (request.CurrentUserId.HasValue)
                {
                    var users = await _userRepository.GetAsync(
                        predicate: u => u.Id == request.CurrentUserId.Value,
                        include: q => q.Include(u => u.Profile)
                    );
                    var user = users.FirstOrDefault();
                    if (user?.Profile != null && product.Restaurant != null && product.Restaurant.OwnerId == user.Profile.Id)
                    {
                        isOwner = true;
                    }
                }
                if (!isOwner)
                {
                    return ApiResponse.Failure(404, "Product was not found.");
                }
            }
            else if (product.Status == ProductStatus.Pending || product.IsHidden || product.IsDeleted)
            {
                bool isOwner = false;
                if (request.CurrentUserId.HasValue)
                {
                    var users = await _userRepository.GetAsync(
                        predicate: u => u.Id == request.CurrentUserId.Value,
                        include: q => (Microsoft.EntityFrameworkCore.Query.IIncludableQueryable<User, object>)q.Include(u => u.Profile!)
                    );
                    var user = users.FirstOrDefault();
                    if (user?.Profile != null && product.Restaurant != null && product.Restaurant.OwnerId == user.Profile.Id)
                    {
                        isOwner = true;
                    }
                }
                if (!isOwner)
                {
                    return ApiResponse.Failure(404, "Product was not found.");
                }
            }

            var productDto = _mapper.Map<ProductDto>(product);

            var now = DateTime.UtcNow;
            var activeFlashSale = await _flashSaleProductRepository.GetAsync(
                predicate: fsp => fsp.ProductId == product.Id && 
                                  fsp.Status == FlashSaleProductStatus.Approved &&
                                  fsp.FlashSale.StartDate <= now && 
                                  fsp.FlashSale.EndDate >= now &&
                                  !fsp.FlashSale.IsDeleted,
                include: q => q.Include(fsp => fsp.FlashSale)
            );

            var fspItem = activeFlashSale.FirstOrDefault();
            if (fspItem != null)
            {
                productDto.FlashSalePrice = fspItem.FlashSalePrice;
            }

            return ApiResponse.Success(productDto, "Product detail retrieved successfully");
        }
    }
}
