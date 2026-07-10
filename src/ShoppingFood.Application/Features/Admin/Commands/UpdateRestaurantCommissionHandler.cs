using MediatR;
using ShoppingFood.Application.Interfaces;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class UpdateRestaurantCommissionHandler : IRequestHandler<UpdateRestaurantCommissionCommand, bool>
    {
        private readonly IRestaurantProfileRepository _repository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateRestaurantCommissionHandler(IRestaurantProfileRepository repository, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(UpdateRestaurantCommissionCommand request, CancellationToken cancellationToken)
        {
            var profiles = await _repository.GetAsync(p => p.Id == request.RestaurantId);
            var profile = profiles.FirstOrDefault();
            
            if (profile == null)
            {
                return false;
            }

            profile.CustomCommissionRate = request.CustomCommissionRate;
            profile.UpdatedAt = DateTime.UtcNow;

            _repository.Update(profile);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}
