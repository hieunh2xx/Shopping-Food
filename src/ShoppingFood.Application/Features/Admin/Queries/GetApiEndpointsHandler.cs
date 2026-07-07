using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Dto.Admin;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetApiEndpointsHandler : IRequestHandler<GetApiEndpointsQuery, ApiResponse>
    {
        private readonly IApiEndpointRepository _endpointRepository;

        public GetApiEndpointsHandler(IApiEndpointRepository endpointRepository)
        {
            _endpointRepository = endpointRepository;
        }

        public async Task<ApiResponse> Handle(GetApiEndpointsQuery request, CancellationToken cancellationToken)
        {
            var endpointsList = await _endpointRepository.GetAllAsync();
            var endpoints = endpointsList
                .OrderBy(e => e.Module)
                .ThenBy(e => e.Name)
                .Select(e => new ApiEndpointDto
                {
                    Id = e.Id,
                    Method = e.Method,
                    Path = e.Path,
                    Name = e.Name,
                    IsPublished = e.IsPublished,
                    Module = e.Module
                })
                .ToList();

            return ApiResponse.Success(endpoints);
        }
    }
}
