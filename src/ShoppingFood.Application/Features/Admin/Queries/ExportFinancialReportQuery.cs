using MediatR;
using ShoppingFood.Core.Base;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class ExportFinancialReportQuery : IRequest<ExportFinancialReportResult>
    {
        public int Days { get; set; } = 30;
        public string Format { get; set; } = "excel"; // "excel" or "pdf"
    }

    public class ExportFinancialReportResult
    {
        public byte[] FileContent { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
    }
}
