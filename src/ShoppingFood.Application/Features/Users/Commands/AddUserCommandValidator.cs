using FluentValidation;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class AddUserCommandValidator : AbstractValidator<AddUserCommand>
    {
        private readonly IUserRepository _userRepository;

        public AddUserCommandValidator(IUserRepository userRepository)
        {
            _userRepository = userRepository;

            RuleFor(p => p.UserName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .NotNull()
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.")
                .MustAsync(async (username, token) => !await _userRepository.ExistsAsync(u => u.UserName == username))
                .WithMessage("UserName already exists.");

            RuleFor(p => p.Password)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MinimumLength(6).WithMessage("{PropertyName} must be at least 6 characters.");

            RuleFor(p => p.FullName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(p => p.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("A valid email address is required.")
                .MustAsync(async (email, token) => !await _userRepository.ExistsAsync(u => u.Email == email))
                .WithMessage("Email already exists.");

            RuleFor(p => p.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Matches(@"^\d{9,15}$").WithMessage("Phone number must contain 9 to 15 digits.")
                .MustAsync(async (phone, token) => !await _userRepository.ExistsAsync(u => u.Phone == phone))
                .WithMessage("Phone number already exists.");
        }
    }
}
