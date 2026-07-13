using System;

namespace ShoppingFood.Dto.Product
{
    public class ProductRecommendationDto : ProductDto
    {
        public string ReasonTag { get; set; } = string.Empty;
        public int ScoreRank { get; set; }
    }
}
