namespace ShoppingFood.Dto.User
{
    public class VerifyLoginOtpRequest
    {
        public string PreAuthToken { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }
}
