using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetBlacklistKeywordsQuery : BaseCommand, IRequest<ApiResponse>
    {
    }
}
