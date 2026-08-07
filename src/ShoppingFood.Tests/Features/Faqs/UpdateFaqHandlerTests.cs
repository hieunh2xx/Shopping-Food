using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Faqs.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Faqs
{
    public class UpdateFaqHandlerTests
    {
        private readonly Mock<IFaqRepository> _faqRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly UpdateFaqHandler _handler;

        public UpdateFaqHandlerTests()
        {
            _faqRepoMock = new Mock<IFaqRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _handler = new UpdateFaqHandler(_userRepoMock.Object, _faqRepoMock.Object, _unitOfWorkMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new UpdateFaqCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_FaqNotFound_Returns404()
        {
            _faqRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Faq?)null);

            var command = new UpdateFaqCommand { CurrentUserId = Guid.NewGuid(), Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Faq not found.");
        }

        [Fact]
        public async Task Handle_Success_UpdatesFaq()
        {
            var faq = new Faq { Id = Guid.NewGuid(), Question = "Old Q" };
            _faqRepoMock.Setup(r => r.GetByIdAsync(faq.Id)).ReturnsAsync(faq);

            var command = new UpdateFaqCommand 
            { 
                CurrentUserId = Guid.NewGuid(), 
                Id = faq.Id,
                Question = "New Q",
                Answer = "New A",
                DisplayOrder = 2,
                IsActive = false
            };

            var expectedDto = new FaqDto { Id = faq.Id, Question = "New Q" };
            _mapperMock.Setup(m => m.Map<FaqDto>(faq)).Returns(expectedDto);

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Updated Faq successfully.");
            
            faq.Question.Should().Be("New Q");
            faq.IsActive.Should().BeFalse();
            
            _faqRepoMock.Verify(r => r.Update(faq), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
            
            var data = result.Data as FaqDto;
            data.Should().NotBeNull();
            data!.Question.Should().Be("New Q");
        }
    }
}
