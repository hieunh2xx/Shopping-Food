using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Query;
using Moq;
using ShoppingFood.Application.Features.Faqs.Queries;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Faq;
using ShoppingFood.Repository.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Faqs
{
    public class GetFaqHandlerTests
    {
        private readonly Mock<IFaqRepository> _faqRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly GetFaqHandler _handler;

        public GetFaqHandlerTests()
        {
            _faqRepoMock = new Mock<IFaqRepository>();
            _userRepoMock = new Mock<IUserRepository>();
            _mapperMock = new Mock<IMapper>();

            _handler = new GetFaqHandler(_faqRepoMock.Object, _userRepoMock.Object, _mapperMock.Object);
        }

        [Fact]
        public async Task Handle_NotAdmin_ReturnsOnlyActiveFaqs()
        {
            // Setup Faq Repo mock to just return a dummy list to verify mapper output
            var faqs = new List<Faq> { new Faq { Id = Guid.NewGuid(), IsActive = true } };
            _faqRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Faq, bool>>>(),
                It.IsAny<Func<IQueryable<Faq>, IOrderedQueryable<Faq>>>(),
                It.IsAny<Func<IQueryable<Faq>, IIncludableQueryable<Faq, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(faqs.AsReadOnly());

            var dtos = new List<FaqDto> { new FaqDto { Id = faqs[0].Id } };
            _mapperMock.Setup(m => m.Map<List<FaqDto>>(It.IsAny<IReadOnlyList<Faq>>())).Returns(dtos);

            var query = new GetFaqsQuery { CurrentUserId = null }; // Guest user
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            var data = result.Data as List<FaqDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(1);
        }

        [Fact]
        public async Task Handle_AdminUser_CanReturnInactiveFaqs()
        {
            var adminUserId = Guid.NewGuid();
            var adminUser = new User { Id = adminUserId, Profile = new UserProfile { Role = UserRole.Admin } };
            
            _userRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<User, bool>>>(),
                It.IsAny<Func<IQueryable<User>, IOrderedQueryable<User>>>(),
                It.IsAny<Func<IQueryable<User>, IIncludableQueryable<User, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(new List<User> { adminUser }.AsReadOnly());

            var faqs = new List<Faq> { new Faq { Id = Guid.NewGuid(), IsActive = false } };
            _faqRepoMock.Setup(r => r.GetAsync(
                It.IsAny<Expression<Func<Faq, bool>>>(),
                It.IsAny<Func<IQueryable<Faq>, IOrderedQueryable<Faq>>>(),
                It.IsAny<Func<IQueryable<Faq>, IIncludableQueryable<Faq, object>>>(),
                It.IsAny<int>(), It.IsAny<int>(), It.IsAny<bool>()))
                .ReturnsAsync(faqs.AsReadOnly());

            var dtos = new List<FaqDto> { new FaqDto { Id = faqs[0].Id } };
            _mapperMock.Setup(m => m.Map<List<FaqDto>>(It.IsAny<IReadOnlyList<Faq>>())).Returns(dtos);

            var query = new GetFaqsQuery { CurrentUserId = adminUserId, IsActive = false }; // Admin requesting inactive
            var result = await _handler.Handle(query, CancellationToken.None);
            
            result.Code.Should().Be(200);
            var data = result.Data as List<FaqDto>;
            data.Should().NotBeNull();
            data!.Count.Should().Be(1);
        }
    }
}
