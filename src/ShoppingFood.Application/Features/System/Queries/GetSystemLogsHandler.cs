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
    public class GetSystemLogsHandler : IRequestHandler<GetSystemLogsQuery, ApiResponse>
    {
        private readonly LogContext _logContext;
        private readonly IMapper _mapper;

        public GetSystemLogsHandler(LogContext logContext, IMapper mapper)
        {
            _logContext = logContext;
            _mapper = mapper;
        }

        public async Task<ApiResponse> Handle(GetSystemLogsQuery request, CancellationToken cancellationToken)
        {
            var filterLower = request.Filter?.ToLower();

            var query = _logContext.ActionLogs.AsNoTracking();

            if (!string.IsNullOrEmpty(filterLower))
            {
                query = query.Where(x => 
                    x.UserName.ToLower().Contains(filterLower) || 
                    x.Action.ToLower().Contains(filterLower) || 
                    x.Message.ToLower().Contains(filterLower));
            }

            var total = await query.CountAsync(cancellationToken);

            query = request.OrderDirection?.ToLower() == "asc" 
                ? query.OrderBy(x => x.CreatedAt) 
                : query.OrderByDescending(x => x.CreatedAt);

            var logs = await query
                .Skip(request.Skip)
                .Take(request.Take)
                .ToListAsync(cancellationToken);

            var dtos = _mapper.Map<IReadOnlyList<ActionLogDto>>(logs);

            return ApiResponse.Success(dtos, "Action logs retrieved successfully.", total);
        }
    }
}
