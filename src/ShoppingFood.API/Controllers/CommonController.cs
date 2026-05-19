using System;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Dto.Security;
using ShoppingFood.Dto.User;

namespace ShoppingFood.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommonController : ControllerBase
    {
        protected readonly IMediator _mediator;
        
        public UserDto userDto => (User as MyPrincipal)?.UserDto!;

        public CommonController(IMediator mediator)
        {
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
        }
    }
}
