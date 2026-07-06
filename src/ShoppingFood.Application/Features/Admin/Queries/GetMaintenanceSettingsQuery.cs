using MediatR;
using ShoppingFood.Dto.System;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class GetMaintenanceSettingsQuery : IRequest<MaintenanceSettingsDto>
    {
    }
}
