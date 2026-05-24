using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Menu.Commands
{
    public class UpdateMenuCategoryCommanValidator : AbstractValidator<UpdateMenuCategoryCommand>
    {
        private readonly IMenuCategoryRepository _menuCategoryRepository;

        public UpdateMenuCategoryCommanValidator(IMenuCategoryRepository menuCategoryRepository) 
        {
            _menuCategoryRepository = menuCategoryRepository;
            RuleFor(m => m.Title)
                .NotEmpty().WithMessage("{PropertyName} is required");

            RuleFor(m => m.SortOrder)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .GreaterThan(0).WithMessage("Sort order must be greater than 0");

            RuleFor(m => m)
                .MustAsync(BeUniqueTitleRestaurant).WithMessage("A category with this title already exists in this restaurant.");
        }

        private async Task<bool> BeUniqueTitleRestaurant(UpdateMenuCategoryCommand command, CancellationToken token)
        {
            var existing = await _menuCategoryRepository.GetAsync(c =>
                c.Title.ToLower() == command.Title.ToLower() &&
                c.SortOrder == command.SortOrder);
            return existing.Count == 0;
        }
    }
}
