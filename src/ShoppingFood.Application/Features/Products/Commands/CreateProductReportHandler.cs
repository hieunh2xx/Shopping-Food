using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class CreateProductReportHandler : IRequestHandler<CreateProductReportCommand, ApiResponse>
    {
        private readonly IProductReportRepository _productReportRepository;
        private readonly IProductRepository _productRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateProductReportHandler(
            IProductReportRepository productReportRepository,
            IProductRepository productRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper
            ) 
        {
            _productReportRepository = productReportRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<ApiResponse> Handle(CreateProductReportCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(request.ProductId);
                if (product == null)
                    return ApiResponse.Failure(404, "This product cannot be found");

                var user = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId,
                    include: q => q.Include(u => u.Profile)
                    );

                var userProfile = user.FirstOrDefault()?.Profile;
                if (userProfile == null)
                    return ApiResponse.Failure(404, "User profile not found");

                var report = _mapper.Map<ProductReport>(request);
                report.Id = Guid.NewGuid();
                report.ReporterId = userProfile.Id;
                report.Status = ProductReportStatus.Pending;
                report.CreatedAt = DateTime.UtcNow;
                report.UpdatedAt = DateTime.UtcNow;
                
                _productReportRepository.Add( report );
                await _unitOfWork.SaveChangesAsync();

                var dto = _mapper.Map<ProductReportDto>(report);

                return ApiResponse.Success(dto, "Your report has been submitted and is pending review.");
            }
            catch (Exception ex) 
            {
                await _unitOfWork.LogErrorAsync("CreateProductReportHandler.Handle", ex);
                return ApiResponse.Failure(400, $"An error occurred: {ex.Message}");
            }
        }
    }
}
