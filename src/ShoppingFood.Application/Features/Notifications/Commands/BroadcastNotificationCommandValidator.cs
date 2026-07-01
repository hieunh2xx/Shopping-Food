using FluentValidation;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class BroadcastNotificationCommandValidator : AbstractValidator<BroadcastNotificationCommand>
    {
        public BroadcastNotificationCommandValidator()
        {
            RuleFor(x => x.FlashSaleId)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.CustomMessage)
                .MaximumLength(500).WithMessage("{PropertyName} must not exceed 500 characters.");

            RuleFor(x => x.TargetAudience)
                .IsInEnum().WithMessage("{PropertyName} must be a valid enum value.");

            RuleFor(x => x.TargetTier)
                .NotNull().WithMessage("{PropertyName} is required when TargetAudience is set to a specific tier.")
                .When(x => x.TargetAudience == TargetAudience.ByTier);

            RuleFor(x => x.TargetUserIds)
                .NotNull()
                .Must(ids => ids != null && ids.Count > 0)
                .WithMessage("{PropertyName} must contai at least one user ID.")
                .When(x => x.TargetAudience == TargetAudience.SpecificCustomers);
        }
    }
}
