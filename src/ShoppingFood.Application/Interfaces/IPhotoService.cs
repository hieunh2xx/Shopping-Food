using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace ShoppingFood.Application.Interfaces
{
    public interface IPhotoService
    {
        Task<string?> AddPhotoAsync(IFormFile file);
        Task<bool> DeletePhotoAsync(string publicId);
    }
}
