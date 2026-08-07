using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Moq;
using ShoppingFood.Application.Features.Faqs.Queries;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Faqs
{
    public class GetFaqDetailHandlerTests
    {
        private readonly Mock<IFaqRepository> _faqRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetFaqDetailHandler _handler;

        public GetFaqDetailHandlerTests()
        {
            _faqRepoMock = new Mock<IFaqRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new GetFaqDetailHandler(_faqRepoMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_FaqNotFound_Returns404()
        {
            _faqRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Faq?)null);

            var query = new GetFaqDetailQuery { Id = Guid.NewGuid() };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(404);
            result.Message.Should().Be("Faq not found.");
        }

        [Fact]
        public async Task Handle_Success_ReturnsMappedFaq()
        {
            var faq = new Faq { Id = Guid.NewGuid(), Question = "Q" };
            _faqRepoMock.Setup(r => r.GetByIdAsync(faq.Id)).ReturnsAsync(faq);

            var expectedDto = new FaqDto { Id = faq.Id, Question = "Q" };
            _mapperMock.Setup(m => m.Map<FaqDto>(faq)).Returns(expectedDto);

            var query = new GetFaqDetailQuery { Id = faq.Id };
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            
            var data = result.Data as FaqDto;
            data.Should().NotBeNull();
            data!.Question.Should().Be("Q");
        }
    }
}
