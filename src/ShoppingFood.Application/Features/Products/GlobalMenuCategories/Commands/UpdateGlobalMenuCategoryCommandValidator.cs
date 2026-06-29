using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.GlobalMenuCategories.Commands
{
    public class UpdateGlobalMenuCategoryCommandValidator : AbstractValidator<UpdateGlobalMenuCategoryCommand>
    {
        private readonly IGlobalMenuCategoryRepository _globalMenuCategoryRepository;

        public UpdateGlobalMenuCategoryCommandValidator(IGlobalMenuCategoryRepository globalMenuCategoryRepository)
        {
            _globalMenuCategoryRepository = globalMenuCategoryRepository;

            RuleFor(p => p.Name)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .NotNull();
            RuleFor(p => p.SortOrder)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0");
            RuleFor(p => p)
                .MustAsync(BeUniqueName).WithMessage("This category already exist");
        }

        private async Task<bool> BeUniqueName(UpdateGlobalMenuCategoryCommand command, CancellationToken token)
        {
            var existing = await _globalMenuCategoryRepository.GetAsync(p =>
                p.Name.ToLower() == command.Name.ToLower() && p.Id != command.Id);
            return existing.Count == 0;
        }
    }
}
