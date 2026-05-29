namespace ShoppingFood.Dto.User
{
    public class SendLoginOtpRequest
    {
        public string PreAuthToken { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
    }
}
