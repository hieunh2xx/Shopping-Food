using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;
using ShoppingFood.Dto.Log;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.System.Queries
{
    public class GetSystemErrorLogsHandler : IRequestHandler<GetSystemErrorLogsQuery, ApiResponse>
    {
        private readonly LogContext _logContext;
        private readonly IMapper _mapper;

        public GetSystemErrorLogsHandler(LogContext logContext, IMapper mapper)
        {
            _logContext = logContext;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetSystemErrorLogsQuery request, CancellationToken cancellationToken)
        {
            var filterLower = request.Filter?.ToLower();

            var query = _logContext.ErrorLogs.AsNoTracking();

            if (!string.IsNullOrEmpty(filterLower))
            {
                query = query.Where(x => 
                    x.Action.ToLower().Contains(filterLower) || 
                    x.ExceptionMessage.ToLower().Contains(filterLower));
            }

            var total = await query.CountAsync(cancellationToken);

            query = request.OrderDirection?.ToLower() == "asc" 
                ? query.OrderBy(x => x.CreatedAt) 
                : query.OrderByDescending(x => x.CreatedAt);

            var logs = await query
                .Skip(request.Skip)
                .Take(request.Take)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<IReadOnlyList<ErrorLogDto>>(logs);

            return ApiResponse.Success(dtos, "Error logs retrieved successfully.", total);
        }
    }
}
