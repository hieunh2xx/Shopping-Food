using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShoppingFood.Application.Features.LoyaltyPoints.Commands;
using ShoppingFood.Application.Features.LoyaltyPoints.Queries;
using ShoppingFood.Core.Base;
using ShoppingFood.Core.Interfaces;
using ShoppingFood.Domain.Enums;
using ShoppingFood.Domain.Models;
using ShoppingFood.Repository.Implementations;
using ShoppingFood.Repository.Interfaces;

namespace ShoppingFood.API.Controllers
{
    public class LoyaltyPointController : CommonController
    {
        private readonly IMemberTierConfigRepository _memberTierConfigRepository;
        private readonly ILoyaltyPointRepository _loyaltyPointRepository;
        private readonly INotificationRepository _notificationRepository;
        private readonly IUnitOfWork _unitOfWork;

        public LoyaltyPointController(
            IMediator mediator,
            IMemberTierConfigRepository memberTierConfigRepository,
            ILoyaltyPointRepository loyaltyPointRepository,
            INotificationRepository notificationRepository,
            IUnitOfWork unitOfWork) : base(mediator)
        {
            _memberTierConfigRepository = memberTierConfigRepository;
            _loyaltyPointRepository = loyaltyPointRepository;
            _notificationRepository = notificationRepository;
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Get()
        {
            var query = new GetCustomerLoyaltyPointsQuery();
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpGet("gifts")]
        public async Task<ActionResult<ApiResponse>> GetActiveGifts()
        {
            var query = new GetPointGiftConfigsQuery { IsActiveOnly = true };
            if (userDto != null)
            {
                query.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(query);
            return Ok(response);
        }

        [HttpPost("redeem")]
        public async Task<ActionResult<ApiResponse>> Redeem([FromBody] RedeemPointGiftCommand command)
        {
            if (userDto != null)
            {
                command.CurrentUserId = userDto.Id;
            }
            var response = await _mediator.Send(command);
            return Ok(response);
        }

        /// <summary>
        /// Ép hệ thống thực thi cập nhật hạng ngay lập tức thủ công
        /// </summary>
        /// <returns></returns>
        [HttpPost("evaluate-tiers")]
        public async Task<ActionResult<ApiResponse>> EvaluateTiers()
        {
            var response = await _mediator.Send(new EvaluateMemberTiersCommand());
            return Ok(response);
        }

        /// <summary>
        /// Lấy mốc điểm của các rank đang có trong db
        /// </summary>
        /// <returns></returns>
        [HttpGet("tier-configs")]
        public async Task<ActionResult<ApiResponse>> GetTierConfigs()
        {
            var tiers = await _memberTierConfigRepository.GetAsync();
            var sortedTiers = tiers.OrderBy(c => c.MinPoints).ToList();
            return Ok(ApiResponse.Success(sortedTiers, "Successfully retrieved member tier configurations."));
        }

        /// <summary>
        /// Add hoặc update rank
        /// </summary>
        /// <param name="tier"></param>
        /// <param name="minPoints"></param>
        /// <returns></returns>
        [HttpPost("tier-configs")]
        public async Task<ActionResult<ApiResponse>> AddOrUpdateTierConfig([FromQuery] MemberTier tier, [FromQuery] int minPoints)
        {
            if (minPoints < 0)
                return BadRequest(ApiResponse.Failure(400, "Min points cannot be less than 0"));

            var configs = await _memberTierConfigRepository.GetAsync();
            var config = configs.FirstOrDefault(c => c.Tier == tier);

            if(config == null)
            {
                config = new MemberTierConfig
                {
                    Id = Guid.NewGuid(),
                    Tier = tier,
                    MinPoints = minPoints,
                    CreatedAt = DateTime.UtcNow
                };
                _memberTierConfigRepository.Add(config);
            }
            else
            {
                config.MinPoints = minPoints;
                _memberTierConfigRepository.Update(config);
            }
            await _unitOfWork.SaveChangesAsync();
            return Ok(ApiResponse.Success(config, $"Successfully added/updated min points for tier {tier}."));
        }
        /// <summary>
        /// sửa rank của 1 tài khoản cụ thể
        /// </summary>
        /// <param name="userId"></param>
        /// <param name="newTier"></param>
        /// <returns></returns>
        [HttpPut("adjust-user-tier")]
        public async Task<ActionResult<ApiResponse>> AdjustUserTier([FromQuery] Guid userId, [FromQuery] MemberTier newTier)
        {
            var loyaltyPoints = await _loyaltyPointRepository.GetAsync();
            var loyaltyPoint = loyaltyPoints.FirstOrDefault(lp => lp.UserAccountId == userId);

            if (loyaltyPoint == null)
                return NotFound(ApiResponse.Failure(404, "Customer loyalty point wallet not found."));

            var oldTier = loyaltyPoint.Tier;
            loyaltyPoint.Tier = newTier;
            loyaltyPoint.UpdatedAt = DateTime.UtcNow;
            _loyaltyPointRepository.Update(loyaltyPoint);

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = "Hạng thành viên của bạn đã thay đổi",
                Message = $"Tài khoản của bạn đã được Admin điều chỉnh hạng thành viên: {oldTier} -> {newTier}",
                NotificationType = NotificationType.Loyalty,
                IsRead = false,
                CreateAt = DateTime.UtcNow
            };
            _notificationRepository.Add(notification);

            await _unitOfWork.SaveChangesAsync();
            return Ok(ApiResponse.Success(new {userId, oldTier, newTier}, "Successfully adjusted member tier manually."));
        }
    }
}
