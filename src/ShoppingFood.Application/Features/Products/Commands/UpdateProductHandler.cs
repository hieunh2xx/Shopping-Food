using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Context;
using ShoppingFood.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductHandler : IRequestHandler<UpdateProductCommand, ApiResponse>
    {
        private readonly IProductRepository _productRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ShoppingFoodContext _dbContext;

        public UpdateProductHandler(
            IProductRepository productRepository, 
            IUnitOfWork unitOfWork, 
            IMapper mapper,
            ShoppingFoodContext dbContext)
        {
            _productRepository = productRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _dbContext = dbContext;
        }
        public async Task<ApiResponse> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdWithDetailsAsync(request.Id);

                if (product == null) 
                    return ApiResponse.Failure(404, "This dish cannot be found.");

                product.ItemName = request.ItemName;
                product.Description = request.Description;
                product.Price = request.Price;
                product.CategoryId = request.CategoryId;
                product.GlobalCategoryId = request.GlobalCategoryId;
                product.UpdatedAt = DateTime.UtcNow;

                UpdateImages(product, request.ImageUrls);
                UpdateToppings(product, request.ToppingIds);
                UpdateSizes(product, request.Sizes);

                var modifiedEntries = _dbContext.ChangeTracker.Entries().Where(e => e.State == EntityState.Modified).ToList();
                foreach (var entry in modifiedEntries)
                {
                    if (entry.Entity is ProductImage || entry.Entity is ProductTopping)
                    {
                        entry.State = EntityState.Unchanged;
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                var productDto = _mapper.Map<ProductDto>(product);
                return ApiResponse.Success(productDto, "Update product successfully");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                var details = string.Join("; ", ex.Entries.Select(e => $"Entity: {e.Entity.GetType().Name}, State: {e.State}, Key: {string.Join(",", e.Metadata.FindPrimaryKey().Properties.Select(p => e.Property(p.Name).CurrentValue))}"));
                await _unitOfWork.LogErrorAsync("UpdateProductHandler.Handle.Concurrency", new Exception($"Concurrency details: {details}", ex));
                return ApiResponse.Failure(400, $"Lỗi cập nhật: {details}");
            }
            catch (Exception ex)
            {
                await _unitOfWork.LogErrorAsync("UpdateProductHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }

        private void UpdateImages(Product product, List<string>? imageUrls)
        {
            if (imageUrls == null) return;

            // Explicitly remove all existing images that are not in the new list
            var imagesToRemove = product.Images
                .Where(i => !imageUrls.Contains(i.ImageUrl))
                .ToList();
            
            foreach (var image in imagesToRemove)
            {
                product.Images.Remove(image);
                _dbContext.Set<ProductImage>().Remove(image);
            }

            // Explicitly add new images that are not in the existing list
            var existingUrls = product.Images.Select(i => i.ImageUrl).ToList();
            var urlsToAdd = imageUrls.Where(url => !existingUrls.Contains(url)).ToList();

            foreach (var url in urlsToAdd)
            {
                var newImage = new ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    ImageUrl = url,
                    IsPrimary = false // We will set the primary below
                };
                product.Images.Add(newImage);
                _dbContext.Set<ProductImage>().Add(newImage);
            }

            // Ensure the first image in the ordered list is marked as primary
            if (product.Images.Any())
            {
                foreach (var img in product.Images)
                {
                    img.IsPrimary = false;
                }
                
                // Set the one matching the first URL in the request as primary
                var firstUrl = imageUrls.FirstOrDefault();
                if (firstUrl != null)
                {
                    var primaryImg = product.Images.FirstOrDefault(i => i.ImageUrl == firstUrl);
                    if (primaryImg != null)
                    {
                        primaryImg.IsPrimary = true;
                    }
                }
            }
        }

        private void UpdateToppings(Product product, List<Guid>? toppingIds)
        {
            if (toppingIds == null) return;

            // Remove toppings that are not in the request
            var toppingsToRemove = product.ProductToppings
                .Where(pt => !toppingIds.Contains(pt.ToppingId))
                .ToList();
            foreach (var topping in toppingsToRemove)
            {
                product.ProductToppings.Remove(topping);
                _dbContext.Remove(topping);
            }

            // Add new toppings that are not already present
            var existingToppingIds = product.ProductToppings.Select(pt => pt.ToppingId).ToList();
            var toppingsToAdd = toppingIds.Where(id => !existingToppingIds.Contains(id)).ToList();
            foreach (var toppingId in toppingsToAdd)
            {
                product.ProductToppings.Add(new ProductTopping
                {
                    ProductId = product.Id,
                    ToppingId = toppingId
                });
            }
        }

        private void UpdateSizes(Product product, List<ProductSizeDto>? sizes)
        {
            if (sizes == null) return;

            // Remove sizes that are not in the request
            var requestIds = sizes.Select(s => s.Id).Where(id => id != Guid.Empty).ToList();
            var sizesToRemove = product.ProductSizes.Where(s => !requestIds.Contains(s.Id)).ToList();
            foreach (var size in sizesToRemove)
            {
                product.ProductSizes.Remove(size);
                _dbContext.Remove(size);
            }

            // Add or Update sizes
            foreach (var sizeDto in sizes)
            {
                var existingSize = product.ProductSizes.FirstOrDefault(s => s.Id == sizeDto.Id);
                if (existingSize == null)
                {
                    // Add new size
                    var newSize = _mapper.Map<ProductSize>(sizeDto);
                    if (newSize.Id == Guid.Empty)
                    {
                        newSize.Id = Guid.NewGuid();
                    }
                    newSize.ProductId = product.Id;
                    product.ProductSizes.Add(newSize);
                }
                else
                {
                    // Update existing size
                    existingSize.SizeName = sizeDto.SizeName;
                    existingSize.ExtraPrice = sizeDto.ExtraPrice;
                    existingSize.IsDefault = sizeDto.IsDefault;
                }
            }
        }
    }
}
