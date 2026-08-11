using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Payments.Commands
{
    public class AbandonUnpaidSepayPaymentCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid SessionId { get; set; }
    }
}
