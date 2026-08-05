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

            RuleFor(p => p.CategoryId)
                .NotEmpty().WithMessage("CategoryId is required");

            
            RuleFor(p => p)
                .MustAsync(BeUniqueNameInRestaurant)
                .WithMessage("The name of this dish already exists on the restaurant's menu.");

            RuleForEach(p => p.ImageUrls)
                .Must(url => string.IsNullOrEmpty(url) || HasValidImageExtension(url))
                .WithMessage("Each image must be a valid image file (.jpg, .jpeg, .png, .webp).");
        }

        private async Task<bool> BeUniqueNameInRestaurant(UpdateProductCommand command, CancellationToken cancellationToken)
        {
            var existingProduct = await _productRepository.GetAsync(p =>
                p.ItemName.ToLower() == command.ItemName.ToLower() &&
                p.Id != command.Id); 

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
