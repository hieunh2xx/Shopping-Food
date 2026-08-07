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
    public class CreateFaqHandlerTests
    {
        private readonly Mock<IFaqRepository> _faqRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IUnitOfWork> _unitOfWorkMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly CreateFaqHandler _handler;

        public CreateFaqHandlerTests()
        {
            _faqRepoMock = new Mock<IFaqRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _unitOfWorkMock = new Mock<IUnitOfWork>();
            _mapperMock = new Mock<IMapper>();

            _handler = new CreateFaqHandler(_faqRepoMock.Object, _userRepoMock.Object, _unitOfWorkMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_Unauthorized_Returns401()
        {
            var command = new CreateFaqCommand { CurrentUserId = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(401);
            result.Message.Should().Be("Unauthorized.");
        }

        [Fact]
        public async Task Handle_Success_CreatesFaq()
        {
            var userId = Guid.NewGuid();
            var command = new CreateFaqCommand 
            { 
                CurrentUserId = userId,
                Question = "Test Q",
                Answer = "Test A",
                DisplayOrder = 1
            };

            var expectedDto = new FaqDto { Id = Guid.NewGuid(), Question = "Test Q" };

            _mapperMock.Setup(m => m.Map<FaqDto>(It.IsAny<Faq>())).Returns(expectedDto);

            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Created successfully.");
            
            var data = result.Data as FaqDto;
            data.Should().NotBeNull();
            data!.Id.Should().Be(expectedDto.Id);
            data.Question.Should().Be("Test Q");

            _faqRepoMock.Verify(r => r.Add(It.IsAny<Faq>()), Times.Once);
            _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
        }
    }
}
