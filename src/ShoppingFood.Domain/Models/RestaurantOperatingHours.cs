using System;
using ShoppingFood.Domain.Enums;

namespace ShoppingFood.Domain.Models
{
    public static class RestaurantOperatingHours
    {
        public const int VietnamUtcOffsetHours = 7;

        public static TimeSpan GetVietnamTimeOfDay(DateTime utcNow)
            => utcNow.AddHours(VietnamUtcOffsetHours).TimeOfDay;

        public static bool IsWithinHours(TimeSpan? openingTime, TimeSpan? closingTime, DateTime utcNow)
        {
            if (!openingTime.HasValue || !closingTime.HasValue)
                return true;

            return IsWithinHours(openingTime.Value, closingTime.Value, GetVietnamTimeOfDay(utcNow));
        }

        public static bool IsWithinHours(TimeSpan openingTime, TimeSpan closingTime, TimeSpan currentTime)
        {
            if (closingTime < openingTime)
                return currentTime >= openingTime || currentTime <= closingTime;

            return currentTime >= openingTime && currentTime <= closingTime;
        }

        public static bool IsCurrentlyOpen(RestaurantStatus status, TimeSpan? openingTime, TimeSpan? closingTime, DateTime utcNow)
        {
            if (status != RestaurantStatus.Active)
                return false;

            return IsWithinHours(openingTime, closingTime, utcNow);
        }
    }
}
