using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Commands
{
    public class DeleteFaqHandler : IRequestHandler<DeleteFaqCommand, ApiResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IFaqRepository _faqRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteFaqHandler(
            IUserRepository userRepository,
            IFaqRepository faqRepository,
            IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _faqRepository = faqRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ApiResponse> Handle(DeleteFaqCommand request, CancellationToken cancellationToken)
        {
            if (!request.CurrentUserId.HasValue)
                return ApiResponse.Failure(401, "Unauthorized.");



            var faq = await _faqRepository.GetByIdAsync(request.Id);
            if (faq == null)
                return ApiResponse.Failure(404, "Faq not found.");

            _faqRepository.Delete(faq);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse.Success(null, "Deleted faq successfully.");
        }
    }
}
