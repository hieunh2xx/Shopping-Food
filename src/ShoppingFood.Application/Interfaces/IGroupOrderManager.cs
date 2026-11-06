using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.GroupOrders;

namespace ShoppingFood.Application.Interfaces
{
    public interface IGroupOrderManager
    {
        Task<GroupOrder?> LoadAsync(Guid groupOrderId, bool tracking = true);
        Task<GroupOrder?> LoadByCodeAsync(string code);
        Task<string> GenerateCodeAsync();
        /// <summary>Hoàn tiền đã trả của một thành viên về ví người trả. resetToUnpaid = true khi thành viên chỉ hủy thanh toán để sửa món.</summary>
        Task RefundMemberAsync(GroupOrder group, GroupOrderMember member, string reason, bool resetToUnpaid, Guid? referenceId = null, string referenceType = "GroupOrder");
        Task CancelAsync(GroupOrder group, string reason);
        Task<int> ExpireStaleAsync();
        void Notify(Guid userId, string title, string message, Guid? targetId = null);
        GroupOrderSummaryDto ToSummary(GroupOrder group, Guid? currentUserId);
        GroupOrderDetailDto ToDetail(GroupOrder group, Guid? currentUserId);
    }
}
