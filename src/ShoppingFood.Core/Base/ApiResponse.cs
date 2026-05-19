namespace ShoppingFood.Core.Base
{
    public class ApiResponse
    {
        public bool Error { get; set; }
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
        public int Total { get; set; }

        public ApiResponse() { }

        public ApiResponse(bool error, int code, string message, object? data = null, int total = 0)
        {
            Error = error;
            Code = code;
            Message = message;
            Data = data;
            Total = total;
        }

        public static ApiResponse Success(object? data = null, string message = "Success", int total = 0)
        {
            return new ApiResponse(false, 200, message, data, total);
        }

        public static ApiResponse Failure(int code, string message)
        {
            return new ApiResponse(true, code, message);
        }
    }
}
