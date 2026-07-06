using MediatR;
using ClosedXML.Excel;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ShoppingFood.Repository.Interfaces;
using ShoppingFood.Domain.Enums;
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using QuestUnit = QuestPDF.Infrastructure.Unit;

namespace ShoppingFood.Application.Features.Admin.Queries
{
    public class ReportItemDto
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal ShippingFee { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
    }

    public class ExportFinancialReportHandler : IRequestHandler<ExportFinancialReportQuery, ExportFinancialReportResult>
    {
        private readonly IOrderRepository _orderRepository;

        public ExportFinancialReportHandler(IOrderRepository orderRepository)
        {
            _orderRepository = orderRepository;
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public async Task<ExportFinancialReportResult> Handle(ExportFinancialReportQuery request, CancellationToken cancellationToken)
        {
            var endDate = DateTime.UtcNow;
            var startDate = endDate.AddDays(-request.Days);

            var orders = await _orderRepository.GetAsync(
                predicate: o => o.Status == OrderStatus.Delivered && o.CreatedAt.Date >= startDate.Date && o.CreatedAt.Date <= endDate.Date,
                disableTracking: true
            );

            // Calculate 8% VAT
            var reportData = orders.Select(o => new ReportItemDto
            {
                Id = o.Id,
                CreatedAt = o.CreatedAt,
                TotalAmount = o.TotalAmount,
                Tax = Math.Round(o.TotalAmount * 0.08m, 2),
                ShippingFee = o.ShippingFee,
                PaymentMethod = o.PaymentMethod
            }).OrderByDescending(x => x.CreatedAt).ToList();

            if (request.Format.ToLower() == "pdf")
            {
                var pdfBytes = GeneratePdf(reportData, startDate, endDate);
                return new ExportFinancialReportResult
                {
                    FileContent = pdfBytes,
                    ContentType = "application/pdf",
                    FileName = $"BaoCaoTaiChinh_{DateTime.Now:yyyyMMdd}.pdf"
                };
            }
            else
            {
                var excelBytes = GenerateExcel(reportData, startDate, endDate);
                return new ExportFinancialReportResult
                {
                    FileContent = excelBytes,
                    ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    FileName = $"BaoCaoTaiChinh_{DateTime.Now:yyyyMMdd}.xlsx"
                };
            }
        }

        private byte[] GenerateExcel(IEnumerable<ReportItemDto> reportData, DateTime startDate, DateTime endDate)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Báo cáo tài chính");

            worksheet.Cell(1, 1).Value = "BÁO CÁO TÀI CHÍNH";
            worksheet.Range("A1:F1").Merge().Style.Font.SetBold().Font.FontSize = 16;
            worksheet.Range("A1:F1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            worksheet.Cell(2, 1).Value = $"Từ ngày: {startDate:dd/MM/yyyy} - Đến ngày: {endDate:dd/MM/yyyy}";
            worksheet.Range("A2:F2").Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Headers
            var headers = new[] { "Mã đơn hàng", "Ngày tạo", "Tổng tiền", "Thuế VAT (8%)", "Phí vận chuyển", "Phương thức" };
            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cell(4, i + 1).Value = headers[i];
                worksheet.Cell(4, i + 1).Style.Font.Bold = true;
                worksheet.Cell(4, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
            }

            int row = 5;
            decimal totalRevenue = 0;
            decimal totalTax = 0;

            foreach (var item in reportData)
            {
                worksheet.Cell(row, 1).Value = item.Id.ToString();
                worksheet.Cell(row, 2).Value = item.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 3).Value = item.TotalAmount;
                worksheet.Cell(row, 4).Value = item.Tax;
                worksheet.Cell(row, 5).Value = item.ShippingFee;
                worksheet.Cell(row, 6).Value = item.PaymentMethod.ToString();

                totalRevenue += item.TotalAmount;
                totalTax += item.Tax;
                row++;
            }

            worksheet.Cell(row, 2).Value = "TỔNG CỘNG";
            worksheet.Cell(row, 2).Style.Font.Bold = true;
            worksheet.Cell(row, 3).Value = totalRevenue;
            worksheet.Cell(row, 3).Style.Font.Bold = true;
            worksheet.Cell(row, 4).Value = totalTax;
            worksheet.Cell(row, 4).Style.Font.Bold = true;

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        private byte[] GeneratePdf(IEnumerable<ReportItemDto> reportData, DateTime startDate, DateTime endDate)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, QuestUnit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Element(compose => ComposeHeader(compose, startDate, endDate));
                    page.Content().Element(compose => ComposeContent(compose, reportData));
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Trang ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, DateTime startDate, DateTime endDate)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("BÁO CÁO TÀI CHÍNH").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text($"Từ ngày: {startDate:dd/MM/yyyy} - Đến ngày: {endDate:dd/MM/yyyy}").FontSize(12);
                    column.Item().Text($"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(10).FontColor(Colors.Grey.Medium);
                });
            });
        }

        private void ComposeContent(IContainer container, IEnumerable<ReportItemDto> reportData)
        {
            container.PaddingVertical(1, QuestUnit.Centimetre).Column(column =>
            {
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(CellStyle).Text("Mã đơn");
                        header.Cell().Element(CellStyle).Text("Ngày tạo");
                        header.Cell().Element(CellStyle).Text("Tổng tiền");
                        header.Cell().Element(CellStyle).Text("Thuế VAT (8%)");

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        }
                    });

                    decimal totalRevenue = 0;
                    decimal totalTax = 0;

                    foreach (var item in reportData)
                    {
                        var idStr = item.Id.ToString();
                        idStr = idStr.Length > 8 ? idStr.Substring(0, 8) : idStr;

                        var formattedDate = item.CreatedAt.ToString("dd/MM/yyyy");
                        var formattedRevenue = item.TotalAmount.ToString("N0");
                        var formattedTax = item.Tax.ToString("N0");

                        table.Cell().Element(CellStyle).Text(idStr);
                        table.Cell().Element(CellStyle).Text(formattedDate);
                        table.Cell().Element(CellStyle).Text(formattedRevenue);
                        table.Cell().Element(CellStyle).Text(formattedTax);

                        totalRevenue += item.TotalAmount;
                        totalTax += item.Tax;

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                        }
                    }

                    var totalRevenueStr = totalRevenue.ToString("N0");
                    var totalTaxStr = totalTax.ToString("N0");

                    table.Cell().Element(FooterCellStyle).Text("Tổng cộng:");
                    table.Cell().Element(FooterCellStyle).Text("");
                    table.Cell().Element(FooterCellStyle).Text(totalRevenueStr);
                    table.Cell().Element(FooterCellStyle).Text(totalTaxStr);

                    static IContainer FooterCellStyle(IContainer container)
                    {
                        return container.BorderTop(1).BorderColor(Colors.Black).PaddingVertical(5).DefaultTextStyle(x => x.SemiBold());
                    }
                });
            });
        }
    }
}
