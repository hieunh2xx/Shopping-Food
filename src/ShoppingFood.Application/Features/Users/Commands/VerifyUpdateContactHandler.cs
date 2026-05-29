using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShoppingFood.Core.Base;
using ShoppingFood.Domain.Context;

namespace ShoppingFood.Application.Features.Users.Commands
{
    public class VerifyUpdateContactHandler : IRequestHandler<VerifyUpdateContactCommand, ApiResponse>
    {
        private readonly ShoppingFoodContext _dbContext;

        public VerifyUpdateContactHandler(ShoppingFoodContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<ApiResponse> Handle(VerifyUpdateContactCommand request, CancellationToken cancellationToken)
        {
            if (request.CurrentUserId == Guid.Empty)
            {
                return ApiResponse.Failure(401, "Unauthorized");
            }

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.CurrentUserId, cancellationToken);
            if (user == null)
            {
                return ApiResponse.Failure(404, "User not found");
            }

            if (string.IsNullOrEmpty(request.NewEmail) && string.IsNullOrEmpty(request.NewPhone))
            {
                return ApiResponse.Failure(400, "Must provide either new email or new phone.");
            }

            string contact = !string.IsNullOrEmpty(request.NewEmail) ? request.NewEmail : request.NewPhone!;

            var otpRecord = await _dbContext.OtpRecords
                .Where(o => o.EmailOrPhone == contact && o.OtpCode == request.OtpCode)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);

            if (otpRecord == null || otpRecord.IsUsed || otpRecord.ExpiryTime < DateTime.UtcNow)
            {
                if (otpRecord != null)
                {
                    otpRecord.RetriesCount += 1;
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
                return ApiResponse.Failure(400, "Invalid or expired OTP");
            }

            // Verify IP Address for extra security
            if (otpRecord.IpAddress != request.IpAddress)
            {
                return ApiResponse.Failure(400, "Security validation failed. IP mismatch.");
            }

            otpRecord.IsUsed = true;
            
            if (!string.IsNullOrEmpty(request.NewEmail))
            {
                user.Email = request.NewEmail;
                user.IsEmailActive = true;
            }
            else if (!string.IsNullOrEmpty(request.NewPhone))
            {
                user.Phone = request.NewPhone;
            }

            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);

            return ApiResponse.Success(null, "Contact updated successfully");
        }
    }
}
