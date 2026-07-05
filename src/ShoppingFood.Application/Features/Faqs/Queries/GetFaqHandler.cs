using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Queries
{
    public class GetFaqHandler : IRequestHandler<GetFaqsQuery, ApiResponse>
    {
        private readonly IFaqRepository _faqRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public GetFaqHandler(IFaqRepository faqRepository, IUserRepository userRepository, IMapper mapper) {
            _faqRepository = faqRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetFaqsQuery request, CancellationToken cancellationToken)
        {
            bool isAdmin = false;

            if (request.CurrentUserId.HasValue)
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == request.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile),
                    disableTracking: true
                    );
                if (users.FirstOrDefault()?.Profile?.Role == Domain.Enums.UserRole.Admin)
                    isAdmin = true;
            }

            Expression<Func<Faq, bool>> predicate = x => x.IsActive;

            if (isAdmin)
            {
                if (request.IsActive.HasValue)
                    predicate = x => x.IsActive == request.IsActive.Value;
                else
                    predicate = x => true;
            }

            var list = await _faqRepository.GetAsync(
                predicate: predicate,
                orderBy: q => q.OrderBy(f => f.DisplayOrder),
                disableTracking: true
                );

            var resultDto = _mapper.Map<List<FaqDto>>(list);
            return ApiResponse.Success(resultDto);
        }
    }
}
