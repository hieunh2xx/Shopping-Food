namespace ShoppingFood.Dto.User
{
    public class LoginByPhoneRequest
    {
        public string Phone { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }
}
