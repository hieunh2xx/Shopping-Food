using AutoMapper;
using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class CreateBlacklistKeywordHandler : IRequestHandler<CreateBlacklistKeywordCommand, ApiResponse>
    {
        private readonly IBlacklistKeywordRepository _repo;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CreateBlacklistKeywordHandler(IBlacklistKeywordRepository repo, IUnitOfWork unitOfWork, IMapper mapper)
        {
            _repo = repo;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(CreateBlacklistKeywordCommand request, CancellationToken cancellationToken)
        {
            var trimmedKeyword = request.Keyword.Trim();

            var keyword = new BlacklistKeyword
            {
                Id = Guid.NewGuid(),
                Keyword = trimmedKeyword,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _repo.Add(keyword);
            await _unitOfWork.SaveChangesAsync();

            var dto = _mapper.Map<BlacklistKeywordDto>(keyword);
            return ApiResponse.Success(dto, "Keyword added successfully.");
        }
    }
}
