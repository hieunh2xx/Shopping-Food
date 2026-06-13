using Microsoft.AspNetCore.Mvc;

namespace ShoppingFood.API.Controllers
{
    public interface ICoordinatorController
    {
        IActionResult Index();
    }
}