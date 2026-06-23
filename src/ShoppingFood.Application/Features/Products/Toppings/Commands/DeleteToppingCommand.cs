using MediatR;
using ShoppingFood.Core.Base;
using System;

namespace ShoppingFood.Application.Features.Products.Toppings.Commands
{
    public class DeleteToppingCommand : BaseCommand, IRequest<ApiResponse>
    {
        public Guid Id { get; set; }
        public DeleteToppingCommand(Guid id)
        {
            Id = id;
        }
    }
}
