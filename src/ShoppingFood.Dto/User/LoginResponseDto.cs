namespace ShoppingFood.Dto.User
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? Role { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
