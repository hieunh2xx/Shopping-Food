using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Faqs.Commands;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Faqs
{
    public class DeleteFaqHandlerTests
    {
        private readonly Mock<IFaqRepository> _faqRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly DeleteFaqHandler _handler;

        public DeleteFaqHandlerTests()
        {
            _faqRepoMock = new Mock<IFaqRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();

            _handler = new DeleteFaqHandler(_userRepoMock.Object, _faqRepoMock.Object, _unitOfWorkMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new DeleteFaqCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_FaqNotFound_Returns404()
        {
            _faqRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Faq?)null);

            var command = new DeleteFaqCommand { CurrentUserId = Guid.NewGuid(), Id = Guid.NewGuid() };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Faq not found.");
        }

        [Fact]
        public async Task Handle_Success_DeletesFaq()
        {
            var faq = new Faq { Id = Guid.NewGuid() };
            _faqRepoMock.Setup(r => r.GetByIdAsync(faq.Id)).ReturnsAsync(faq);

            var command = new DeleteFaqCommand { CurrentUserId = Guid.NewGuid(), Id = faq.Id };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Deleted faq successfully.");
            
            _faqRepoMock.Verify(r => r.Delete(faq), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
