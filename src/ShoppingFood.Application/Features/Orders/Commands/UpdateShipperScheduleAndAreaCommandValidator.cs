using FluentValidation;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Orders.Commands
{
    public class UpdateShipperScheduleAndAreaCommandValidator : AbstractValidator<UpdateShipperScheduleAndAreaCommand>
    {
        private static readonly Regex TimeRegex = new Regex(@"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$");
        public UpdateShipperScheduleAndAreaCommandValidator()
        {
            RuleFor(x => x.OperatingLatitude)
                .InclusiveBetween(-90.0, 90.0)
                .WithMessage("Latitude must be between -90 and 90.")
                .When(x => x.OperatingLatitude.HasValue);
            RuleFor(x => x.OperatingLongitude)
                .InclusiveBetween(-180.0, 180.0)
                .WithMessage("Longitude must be between -180 and 180.")
                .When(x => x.OperatingLongitude.HasValue);
            RuleFor(x => x.OperatingRadiusKm)
                .GreaterThan(0)
                .WithMessage("Radius must be greater than 0.")
                .When(x => x.OperatingRadiusKm.HasValue);

            RuleForEach(x => x.WorkingSchedule).ChildRules(schedule =>
            {
                schedule.RuleFor(s => s.From)
                .NotEmpty().WithMessage("Start time is required.")
                .Matches(TimeRegex).WithMessage("Start time must be in HH:mm format.");

                schedule.RuleFor(s => s.To)
                    .NotEmpty().WithMessage("End time is required.")
                    .Matches(TimeRegex).WithMessage("End time must be in HH:mm format.");

                schedule.RuleFor(s => s)
                    .Must(s => string.Compare(s.From, s.To) < 0)
                    .WithMessage("Start time must be earlier than end time.");
            });
        }
    }
}
