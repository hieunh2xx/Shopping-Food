using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Coordinator.Commands
{
    public class SendProposalCommandValidator : AbstractValidator<SendProposalCommand>
    {
        public SendProposalCommandValidator()
        {
            RuleFor(x => x.OrderId).NotEmpty().WithMessage("{PropertyName} is required.");
            RuleFor(x => x.ShipperId).NotEmpty().WithMessage("{PropertyName} is required.");
        }
    }
}
