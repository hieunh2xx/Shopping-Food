using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Admin.Commands
{
    public class CreateBlacklistKeywordCommandValidator : AbstractValidator<CreateBlacklistKeywordCommand>
    {
        private readonly IBlacklistKeywordRepository _repo;

        public CreateBlacklistKeywordCommandValidator(IBlacklistKeywordRepository repo)
        {
            _repo = repo;

            RuleFor(x => x.Keyword)
                .NotEmpty().WithMessage("Keyword is required.")
                .MustAsync(BeUniqueKeyword).WithMessage("Keyword already exists.");
        }

        private async Task<bool> BeUniqueKeyword(string keyword, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(keyword)) return true;
            
            var trimmedKeyword = keyword.Trim();
            var existing = await _repo.GetAsync(x => x.Keyword.ToLower() == trimmedKeyword.ToLower());
            return !existing.Any();
        }
    }
}
