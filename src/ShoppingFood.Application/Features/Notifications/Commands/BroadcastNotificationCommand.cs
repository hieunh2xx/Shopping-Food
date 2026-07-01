using MediatR;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Features.Notifications.Commands
{
    public class BroadcastNotificationCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid FlashSaleId { get; set; }
        public string CustomMessage { get; set; } = string.Empty;
        public TargetAudience TargetAudience { get; set; } = TargetAudience.AllCustomers;
        public MemberTier? TargetTier { get; set; }
        public List<Guid>? TargetUserIds { get; set; }
    }
}
