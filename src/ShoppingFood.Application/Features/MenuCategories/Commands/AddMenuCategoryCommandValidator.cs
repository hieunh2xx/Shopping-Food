using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.MenuCategories.Commands
{
    public class AddMenuCategoryCommandValidator : AbstractValidator<AddMenuCategoryCommand>
    {
        private readonly IMenuCategoryRepository _menuCategoryRepository;

        public AddMenuCategoryCommandValidator(IMenuCategoryRepository menuCategoryRepository) 
        {
            _menuCategoryRepository = menuCategoryRepository;

            RuleFor(m => m.Title)
                .NotEmpty().WithMessage("{PropertyName} is required");

            RuleFor(m => m.RestaurantId)
                .NotEmpty().WithMessage("{PropertyName} is required");

            RuleFor(m => m.SortOrder)
                .NotEmpty().WithMessage("{PropertyName} is required");

            RuleFor(m => m)
                .MustAsync(BeUniqueTitleInRestaurant).WithMessage("A category with this title already exists in this restaurant.");
        }

        private async Task<bool> BeUniqueTitleInRestaurant(AddMenuCategoryCommand command, CancellationToken token)
        {
            var existing = await _menuCategoryRepository.GetAsync(r =>
                r.RestaurantId == command.RestaurantId &&
                r.Title.ToLower() == command.Title.ToLower());
            return existing.Count == 0;
        }
    }
}
