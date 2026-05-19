using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Core.Behaviors
{
    public class UnhandledExceptionBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> 
        where TRequest : IRequest<TResponse>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UnhandledExceptionBehaviour(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
        {
            try
            {
                return await next();
            }
            catch (Exception ex)
            {
                var requestName = typeof(TRequest).Name;
                await _unitOfWork.LogErrorAsync($"MediatR Request: {requestName}", ex);
                throw;
            }
        }
    }
}
