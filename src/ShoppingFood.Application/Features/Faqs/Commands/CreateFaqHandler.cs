using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Commands
{
    public class CreateFaqHandler : IRequestHandler<CreateFaqCommand, ApiResponse>
    {
        private readonly IFaqRepository _faqRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateFaqHandler(
            IFaqRepository faqRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork, 
            IMapper mapper)
        {
            _faqRepository = faqRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(CreateFaqCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var faq = new Faq
            {
                Id = Guid.NewGuid(),
                Question = request.Question,
                Answer = request.Answer,
                DisplayOrder = request.DisplayOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _faqRepository.Add(faq);
            await _unitOfWork.SaveChangesAsync();

            var faqDto = _mapper.Map<FaqDto>(faq);
            return ApiResponse.Success(faqDto, "Created successfully.");
        }
    }
}
