using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Products.Commands
{
    public class AddProductCommandValidator : AbstractValidator<AddProductCommand>
    {
        private readonly IProductRepository _productRepository;

        public AddProductCommandValidator(IProductRepository productRepository)
        {
            _productRepository = productRepository;

            RuleFor(p => p.ItemName)
                .NotEmpty().WithMessage("{PropertyName} is required")
                .NotNull()
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(p => p.Price)
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than 0.");

            RuleFor(p => p.CategoryId)
                .NotEmpty().WithMessage("{PropertyName} is required");

            RuleFor(p => p.RestaurantId)
                .NotEmpty().WithMessage("{PropertyName} is required");
           
            RuleFor(p => p)
                .MustAsync(BeUniqueNameInRestaurant)
                .WithMessage("The name of this dish already exists on the restaurant's menu.");
            RuleForEach(p => p.ImageUrls)
                .Must(url => string.IsNullOrEmpty(url) || HasValidImageExtension(url))
                .WithMessage("Each image must be a valid image file (.jpg, .jpeg, .png, .webp).");
        }

        private async Task<bool> BeUniqueNameInRestaurant(AddProductCommand command, CancellationToken cancellationToken)
        {
            var existingProduct = await _productRepository.GetAsync(p => 
                p.ItemName.ToLower() == command.ItemName.ToLower() && 
                p.RestaurantId == command.RestaurantId);

            return existingProduct.Count == 0;
        }

        private bool HasValidImageExtension(string url)
        {
            if (string.IsNullOrEmpty(url)) return false;
            
            if (url.StartsWith("http://", global::System.StringComparison.OrdinalIgnoreCase) || 
                url.StartsWith("https://", global::System.StringComparison.OrdinalIgnoreCase) ||
                url.StartsWith("data:image", global::System.StringComparison.OrdinalIgnoreCase)) 
            {
                return true;
            }

            var cleanUrl = url.Split('?')[0];
            var ext = Path.GetExtension(cleanUrl).ToLower();
            return ext is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif";
        }
    }
}
