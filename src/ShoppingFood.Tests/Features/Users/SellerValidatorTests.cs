using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class SellerValidatorTests
    {
        private readonly Mock<IUserRepository> _userRepositoryMock;
        private readonly AddSellerCommandValidator _addSellerValidator;
        private readonly ApplySellerCommandValidator _applySellerValidator;

        public SellerValidatorTests()
        {
            _userRepositoryMock = new Mock<IUserRepository>();
            _addSellerValidator = new AddSellerCommandValidator(_userRepositoryMock.Object);
            _applySellerValidator = new ApplySellerCommandValidator();
        }

        [Fact]
        public async Task AddSellerValidator_EmptyFields_ShouldFailValidation()
        {
            // Arrange
            var command = new AddSellerCommand();

            // Act
            var result = await _addSellerValidator.ValidateAsync(command);

            // Assert
            result.IsValid.Should().BeFalse();
            
            // Check that all required fields report empty validation errors
            var errorProperties = result.Errors.Select(e => e.PropertyName).ToList();
            errorProperties.Should().Contain(nameof(AddSellerCommand.UserName));
            errorProperties.Should().Contain(nameof(AddSellerCommand.Password));
            errorProperties.Should().Contain(nameof(AddSellerCommand.Email));
            errorProperties.Should().Contain(nameof(AddSellerCommand.Phone));
            errorProperties.Should().Contain(nameof(AddSellerCommand.BusinessName));
            errorProperties.Should().Contain(nameof(AddSellerCommand.BusinessAddress));
            errorProperties.Should().Contain(nameof(AddSellerCommand.BusinessLicenseUrl));
            errorProperties.Should().Contain(nameof(AddSellerCommand.ShopImageUrl));
            errorProperties.Should().Contain(nameof(AddSellerCommand.ContactInfo));
        }

        [Fact]
        public async Task AddSellerValidator_DuplicateUserCredentials_ShouldFailValidation()
        {
            // Arrange
            _userRepositoryMock.Setup(repo => repo.ExistsAsync(It.Is<Expression<Func<User, bool>>>(exp => exp.Compile()(new User { UserName = "duplicate_user" }))))
                .ReturnsAsync(true);
            _userRepositoryMock.Setup(repo => repo.ExistsAsync(It.Is<Expression<Func<User, bool>>>(exp => exp.Compile()(new User { Email = "duplicate@email.com" }))))
                .ReturnsAsync(true);
            _userRepositoryMock.Setup(repo => repo.ExistsAsync(It.Is<Expression<Func<User, bool>>>(exp => exp.Compile()(new User { Phone = "0987654321" }))))
                .ReturnsAsync(true);

            var command = new AddSellerCommand
            {
                UserName = "duplicate_user",
                Password = "validpassword",
                Email = "duplicate@email.com",
                Phone = "0987654321",
                BusinessName = "My Business",
                BusinessAddress = "123 Street",
                BusinessLicenseUrl = "http://license.url",
                ShopImageUrl = "http://shop.url",
                ContactInfo = "Contact detail"
            };

            // Act
            var result = await _addSellerValidator.ValidateAsync(command);

            // Assert
            result.IsValid.Should().BeFalse();
            var errorMessages = result.Errors.Select(e => e.ErrorMessage).ToList();
            errorMessages.Should().Contain("UserName already exists.");
            errorMessages.Should().Contain("Email already exists.");
            errorMessages.Should().Contain("Phone number already exists.");
        }

        [Fact]
        public async Task AddSellerValidator_InvalidFormats_ShouldFailValidation()
        {
            // Arrange
            _userRepositoryMock.Setup(repo => repo.ExistsAsync(It.IsAny<Expression<Func<User, bool>>>()))
                .ReturnsAsync(false);

            var command = new AddSellerCommand
            {
                UserName = "valid_user",
                Password = "123", // Too short (min 6)
                Email = "invalid-email-format", // Invalid email
                Phone = "12345", // Must contain 10 digits
                BusinessName = "My Business",
                BusinessAddress = "123 Street",
                BusinessLicenseUrl = "http://license.url",
                ShopImageUrl = "http://shop.url",
                ContactInfo = "Contact detail"
            };

            // Act
            var result = await _addSellerValidator.ValidateAsync(command);

            // Assert
            result.IsValid.Should().BeFalse();
            var errorProperties = result.Errors.Select(e => e.PropertyName).ToList();
            errorProperties.Should().Contain(nameof(AddSellerCommand.Password));
            errorProperties.Should().Contain(nameof(AddSellerCommand.Email));
            errorProperties.Should().Contain(nameof(AddSellerCommand.Phone));
        }

        [Fact]
        public async Task ApplySellerValidator_EmptyFields_ShouldFailValidation()
        {
            // Arrange
            var command = new ApplySellerCommand();

            // Act
            var result = await _applySellerValidator.ValidateAsync(command);

            // Assert
            result.IsValid.Should().BeFalse();
            var errorProperties = result.Errors.Select(e => e.PropertyName).ToList();
            errorProperties.Should().Contain(nameof(ApplySellerCommand.BusinessName));
            errorProperties.Should().Contain(nameof(ApplySellerCommand.BusinessAddress));
            errorProperties.Should().Contain(nameof(ApplySellerCommand.ContactInfo));
        }

        [Fact]
        public async Task ApplySellerValidator_ExceedingLength_ShouldFailValidation()
        {
            // Arrange
            var command = new ApplySellerCommand
            {
                BusinessName = new string('A', 151), // Max 150
                BusinessAddress = "123 Street",
                ContactInfo = new string('C', 101) // Max 100
            };

            // Act
            var result = await _applySellerValidator.ValidateAsync(command);

            // Assert
            result.IsValid.Should().BeFalse();
            var errorProperties = result.Errors.Select(e => e.PropertyName).ToList();
            errorProperties.Should().Contain(nameof(ApplySellerCommand.BusinessName));
            errorProperties.Should().Contain(nameof(ApplySellerCommand.ContactInfo));
        }
    }
}
