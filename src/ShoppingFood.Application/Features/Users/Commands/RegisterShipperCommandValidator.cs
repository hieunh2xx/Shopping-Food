using FluentValidation;
using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class RegisterShipperCommandValidator : AbstractValidator<RegisterShipperCommand>
    {
        private readonly IUserRepository _userRepository;

        public RegisterShipperCommandValidator(IUserRepository userRepository) 
        {
            _userRepository = userRepository;

            RuleFor(x => x.UserName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.")
                .MustAsync(async (username, token) => !await _userRepository.ExistsAsync(u => u.UserName == username))
                .WithMessage("UserName already exists.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MinimumLength(6).WithMessage("{PropertyName} must be at least 6 characters.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("A valid email address is required.")
                .MustAsync(async (email, token) => !await _userRepository.ExistsAsync(u => u.Email == email))
                .WithMessage("Email already exists.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^\d{10}$").WithMessage("Phone number must contain 10 digits.")
                .MustAsync(async (phone, token) => !await _userRepository.ExistsAsync(u => u.Phone == phone))
                .WithMessage("Phone number already exists.");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("{PropertyName} is required.");

            RuleFor(x => x.IdentityCardNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.IdentityCardFrontUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(x => x.IdentityCardBackUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(x => x.VehicleType)
                .IsInEnum().WithMessage("Invalid vehicle type (Allowed: Motorcycle, ElectricMotorbike, Car).");

            RuleFor(x => x.VehiclePlateNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.");

            RuleFor(x => x.DriverLicenseUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(x => x.VehicleRegistrationUrl)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");
        }   

    }
}
