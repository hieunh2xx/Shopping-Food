using System;
using System.Collections.Generic;
using System.Linq;
using ShoppingFood.Domain.Models;
using ShoppingFood.Dto.Product;

namespace ShoppingFood.Application.Common
{
    public static class ProductAvailabilityHelper
    {
        public static void RemoveUnavailableToppings(IEnumerable<ProductDto>? products)
        {
            if (products == null) return;

            foreach (var product in products)
            {
                RemoveUnavailableToppings(product);
            }
        }

        public static void RemoveUnavailableToppings(ProductDto? product)
        {
            if (product?.Toppings == null) return;
            product.Toppings = product.Toppings.Where(t => t.IsAvailable).ToList();
        }

        public static string? ValidateSelectedToppings(Product product, IEnumerable<string>? selectedToppingNames)
        {
            if (selectedToppingNames == null) return null;

            foreach (var rawName in selectedToppingNames)
            {
                var name = rawName?.Trim();
                if (string.IsNullOrWhiteSpace(name)) continue;

                var topping = product.ProductToppings?
                    .Select(pt => pt.Topping)
                    .FirstOrDefault(t => t != null && t.ToppingName.Equals(name, StringComparison.OrdinalIgnoreCase));

                if (topping == null)
                    return $"Topping '{name}' không thuộc món này.";

                if (!topping.IsAvailable)
                    return $"Topping '{topping.ToppingName}' hiện đã hết.";
            }

            return null;
        }

        public static string? ValidateSelectedToppingsCsv(Product product, string? selectedToppingsCsv)
        {
            if (string.IsNullOrWhiteSpace(selectedToppingsCsv)) return null;

            var names = selectedToppingsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return ValidateSelectedToppings(product, names);
        }

        public static string? ValidateRestaurantCanAcceptOrders(RestaurantProfile? restaurant, DateTime utcNow)
        {
            if (restaurant == null || !restaurant.IsCurrentlyOpen(utcNow))
                return "Nhà hàng hiện đang đóng cửa, không thể đặt món.";

            return null;
        }
    }
}
