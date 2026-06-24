using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.LoyaltyPoints.Commands
{
    public class CreatePointGiftConfigCommandValidator : AbstractValidator<CreatePointGiftConfigCommand>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IPointGiftConfigRepository _pointGiftConfigRepository;

        public CreatePointGiftConfigCommandValidator(
            IDiscountRepository discountRepository,
            IPointGiftConfigRepository pointGiftConfigRepository)
        {
            _discountRepository = discountRepository;
            _pointGiftConfigRepository = pointGiftConfigRepository;

            RuleFor(x => x.PointRequired).GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.DiscountId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MustAsync(BeAnExistingDiscount).WithMessage("{PropertyName} does not exist.")
                .MustAsync(NotBeDuplicateConfig).WithMessage("{PropertyName} already has a point configuration.");
        }

        private async Task<bool> BeAnExistingDiscount(Guid discountId, CancellationToken token)
        {
            var discount = await _discountRepository.GetByIdAsync(discountId);
            return discount != null && !discount.IsDeleted;
        }

        private async Task<bool> NotBeDuplicateConfig(Guid discountId, CancellationToken token)
        {
            var configs = await _pointGiftConfigRepository.GetAsync(
                predicate: p => p.DiscountId == discountId && !p.IsDeleted
                );
            return !configs.Any();
        }
    }
}
