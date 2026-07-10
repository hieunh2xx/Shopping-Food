using AutoMapper;
using MediatR;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetPlatformFinanceConfigHandler : IRequestHandler<GetPlatformFinanceConfigQuery, PlatformFinanceConfigDto>
    {
        private readonly IPlatformFinanceConfigRepository _repository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public GetPlatformFinanceConfigHandler(IPlatformFinanceConfigRepository repository, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        public async Task<PlatformFinanceConfigDto> Handle(GetPlatformFinanceConfigQuery request, CancellationToken cancellationToken)
        {
            var configs = await _repository.GetAllAsync();
            var config = configs.FirstOrDefault();
            
            if (config == null)
            {
                config = new PlatformFinanceConfig { Id = Guid.NewGuid() };
                _repository.Add(config);
                await _unitOfWork.SaveChangesAsync();
            }

            return _mapper.Map<PlatformFinanceConfigDto>(config);
        }
    }
}
