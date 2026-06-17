using FluentValidation;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Discounts.Commands
{
    public class CreateDiscountCommandValidator : AbstractValidator<CreateDiscountCommand>
    {
        private readonly IDiscountRepository _discountRepository;
        private readonly IUserRepository _userRepository;
        private readonly IRestaurantProfileRepository _restaurantProfileRepository;

        public CreateDiscountCommandValidator(
            IDiscountRepository discountRepository,
            IUserRepository userRepository,
            IRestaurantProfileRepository restaurantProfileRepository)
        {
            _discountRepository = discountRepository;
            _userRepository = userRepository;
            _restaurantProfileRepository = restaurantProfileRepository;

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.")
                .MustAsync(BeUniqueCode).WithMessage("{PropertyName} already exists in this scope.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(200).WithMessage("{PropertyName} must not exceed 200 characters.");

            RuleFor(x => x.Value)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.MinOrderAmount)
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be greater than or equal to 0.");

            RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.MaxUsagePerUser)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(x => x.StartDate)
                .GreaterThanOrEqualTo(DateTime.UtcNow.AddMinutes(-5)).WithMessage("{PropertyName} cannot be in the past.");

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate).WithMessage("EndDate must be greater than StartDate.");
        }

        private async Task<bool> BeUniqueCode(CreateDiscountCommand command, string code, CancellationToken token)
        {
            Guid? targetRestaurantId = null;
            if (command.CurrentUserId.HasValue)
            {
                var users = await _userRepository.GetAsync(
                    predicate: u => u.Id == command.CurrentUserId.Value,
                    include: q => q.Include(u => u.Profile)
                    );
                var user = users.FirstOrDefault();
                if(user?.Profile?.Role == UserRole.Seller || user?.Profile?.Role == UserRole.Mall)
                {
                    var restaurants = await _restaurantProfileRepository.GetAsync(
                        predicate: r => r.OwnerId == user.Profile.Id,
                        disableTracking: true
                        );
                    targetRestaurantId = restaurants.FirstOrDefault()?.Id;
                }
                else if(user?.Profile?.Role == UserRole.Admin)
                {
                    targetRestaurantId = command.RestaurantId;
                }
            }

            return !await _discountRepository.ExistsAsync(d =>
                d.Code.ToUpper() == code.ToUpper() &&
                d.RestaurantId == targetRestaurantId);
        }
    }
}
