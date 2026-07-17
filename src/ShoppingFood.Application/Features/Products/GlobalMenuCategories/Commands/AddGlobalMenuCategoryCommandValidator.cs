using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class AddGlobalMenuCategoryCommandValidator : AbstractValidator<AddGlobalMenuCategoryCommand>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;

        public AddGlobalMenuCategoryCommandValidator(IGlobalMenuCategoryRepository globalMenuCategoryRepository)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;

            RuleFor(p => p.Name)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .NotNull();
            RuleFor(p => p.SortOrder)
                .NotEmpty().WithMessage("PropertyName is required")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0");
            RuleFor(p => p.ImageUrl)
                .Must(url => string.IsNullOrEmpty(url) || HasValidImageExtension(url))
                .WithMessage("{PropertyName} must be a valid image file (.jpg, .jpeg, .png, .webp).");

            RuleFor(p => p)
                .MustAsync(BeUniqueName)
                .WithMessage("This category's name is existing");
        }

        private async Task<bool> BeUniqueName(AddGlobalMenuCategoryCommand command, CancellationToken cancellationToken)
        {
            var existingCategory = await _globalMenuCategoryRepository.GetAsync(p => p.Name.ToLower() == command.Name.ToLower());
            return existingCategory.Count == 0;
        }

        private bool HasValidImageExtension(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            var cleanUrl = url.Split('?')[0];
            var ext = Path.GetExtension(cleanUrl).ToLower();
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp";
        }
    }
}
