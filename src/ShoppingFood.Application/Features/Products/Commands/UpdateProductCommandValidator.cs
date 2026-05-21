using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
    {
        private readonly IProductRepository _productRepository;

        public UpdateProductCommandValidator(IProductRepository productRepository)
        {
            _productRepository = productRepository;

            RuleFor(p => p.Id)
                .NotEmpty().WithMessage("Product ID is required.");

            RuleFor(p => p.ItemName)
                .NotEmpty().WithMessage("ItemName is required")
                .MaximumLength(100).WithMessage("ItemName must not exceed 100 characters.");

            RuleFor(p => p.Price)
                .GreaterThan(0).WithMessage("Price must be greater than 0.");

            RuleFor(p => p.Category)
                .NotEmpty().WithMessage("Category is required");

            
            RuleFor(p => p)
                .MustAsync(BeUniqueNameInRestaurant)
                .WithMessage("The name of this dish already exists on the restaurant's menu.");
        }

        private async Task<bool> BeUniqueNameInRestaurant(UpdateProductCommand command, CancellationToken cancellationToken)
        {
            var existingProduct = await _productRepository.GetAsync(p =>
                p.ItemName.ToLower() == command.ItemName.ToLower() &&
                p.Id != command.Id); 

            return existingProduct.Count == 0;
        }
    }
}
