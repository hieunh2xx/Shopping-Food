using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Commands
{
    public class UpdateFaqHandler : IRequestHandler<UpdateFaqCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFaqRepository _faqRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UpdateFaqHandler(
            IUserRepository userRepository,
            IFaqRepository faqRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _userRepository = userRepository;
            _faqRepository = faqRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(UpdateFaqCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");

            var users = await _userRepository.GetAsync(
                predicate: u => u.Id == request.CurrentUserId.Value,
                include: q => q.Include(u => u.Profile),
                disableTracking: true
                );
            var userProfile = users.FirstOrDefault()?.Profile;
            if (userProfile == null || userProfile.Role != Domain.Enums.UserRole.Admin)
                return ApiResponse.Failure(403, "Forbidden");

            var faq = await _faqRepository.GetByIdAsync(request.Id);
            if (faq == null)
                return ApiResponse.Failure(404, "Faq not found.");

            faq.Question = request.Question;
            faq.Answer = request.Answer;
            faq.DisplayOrder = request.DisplayOrder;
            faq.IsActive = request.IsActive;
            faq.UpdatedAt = DateTime.UtcNow;

            _faqRepository.Update(faq);
            await _unitOfWork.SaveChangesAsync();

            var faqDto = _mapper.Map<FaqDto>(faq);
            return ApiResponse.Success(faqDto, "Updated Faq successfully.");

        }
    }
}
