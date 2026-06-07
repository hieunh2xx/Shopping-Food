using FluentValidation;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class ApproveProductCommandValidator : AbstractValidator<ApproveProductCommand>
    {
        public ApproveProductCommandValidator()
        {
            RuleFor(x => x.ProductId).NotEmpty().WithMessage("Product ID is required.");
        }
    }
}
