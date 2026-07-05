using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Faqs.Queries
{
    public class GetFaqDetailHandler : IRequestHandler<GetFaqDetailQuery, ApiResponse>
    {
        private readonly IFaqRepository _faqRepository;
        private readonly IMapper _mapper;

        public GetFaqDetailHandler(IFaqRepository faqRepository, IMapper mapper)
        {
            _faqRepository = faqRepository;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetFaqDetailQuery request, CancellationToken cancellationToken)
        {
            var faq = await _faqRepository.GetByIdAsync(request.Id);
            if (faq == null)
                return ApiResponse.Failure(404, "Faq not found.");

            var dto = _mapper.Map<FaqDto>(faq);
            return ApiResponse.Success(dto);
        }
    }
}
