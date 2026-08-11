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
        /// <summary>GMV — tổng tiền khách trả.</summary>
        public decimal TotalAmount { get; set; }
        /// <summary>Doanh thu sàn (chiết khấu).</summary>
        public decimal PlatformCommission { get; set; }
        public decimal SellerPayout { get; set; }
        public decimal ShippingFee { get; set; }
        /// <summary>VAT 8% tính trên doanh thu sàn, không trên GMV.</summary>
        public decimal Tax { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
    }

    public class ExportFinancialReportHandler : IRequestHandler<ExportFinancialReportQuery, ExportFinancialReportResult>
    {
        private const decimal VatRate = 0.08m;
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

            // Thuế admin tính trên PlatformCommission (doanh thu thực của sàn),
            // không tính trên TotalAmount vì phần đó đã trả lại seller/shipper.
            var reportData = orders.Select(o => new ReportItemDto
            {
                Id = o.Id,
                CreatedAt = o.CreatedAt,
                TotalAmount = o.TotalAmount,
                PlatformCommission = o.PlatformCommission,
                SellerPayout = o.SellerPayout,
                Tax = Math.Round(o.PlatformCommission * VatRate, 0),
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

            worksheet.Cell(1, 1).Value = "BÁO CÁO TÀI CHÍNH (DOANH THU SÀN)";
            worksheet.Range("A1:H1").Merge().Style.Font.SetBold().Font.FontSize = 16;
            worksheet.Range("A1:H1").Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            worksheet.Cell(2, 1).Value = $"Từ ngày: {startDate:dd/MM/yyyy} - Đến ngày: {endDate:dd/MM/yyyy}";
            worksheet.Range("A2:H2").Merge().Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            worksheet.Cell(3, 1).Value = "Ghi chú: VAT 8% tính trên chiết khấu sàn (PlatformCommission), không tính trên GMV.";
            worksheet.Range("A3:H3").Merge().Style.Font.FontColor = XLColor.Gray;
            worksheet.Range("A3:H3").Style.Font.Italic = true;

            var headers = new[]
            {
                "Mã đơn hàng", "Ngày tạo", "GMV (tổng đơn)", "Chiết khấu sàn",
                "Trả seller", "Thuế VAT (8%)", "Phí vận chuyển", "Phương thức"
            };
            for (int i = 0; i < headers.Length; i++)
            {
                worksheet.Cell(5, i + 1).Value = headers[i];
                worksheet.Cell(5, i + 1).Style.Font.Bold = true;
                worksheet.Cell(5, i + 1).Style.Fill.BackgroundColor = XLColor.LightGray;
            }

            int row = 6;
            decimal totalGmv = 0;
            decimal totalCommission = 0;
            decimal totalSellerPayout = 0;
            decimal totalTax = 0;

            foreach (var item in reportData)
            {
                worksheet.Cell(row, 1).Value = item.Id.ToString();
                worksheet.Cell(row, 2).Value = item.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 3).Value = item.TotalAmount;
                worksheet.Cell(row, 4).Value = item.PlatformCommission;
                worksheet.Cell(row, 5).Value = item.SellerPayout;
                worksheet.Cell(row, 6).Value = item.Tax;
                worksheet.Cell(row, 7).Value = item.ShippingFee;
                worksheet.Cell(row, 8).Value = item.PaymentMethod.ToString();

                totalGmv += item.TotalAmount;
                totalCommission += item.PlatformCommission;
                totalSellerPayout += item.SellerPayout;
                totalTax += item.Tax;
                row++;
            }

            worksheet.Cell(row, 2).Value = "TỔNG CỘNG";
            worksheet.Cell(row, 2).Style.Font.Bold = true;
            worksheet.Cell(row, 3).Value = totalGmv;
            worksheet.Cell(row, 3).Style.Font.Bold = true;
            worksheet.Cell(row, 4).Value = totalCommission;
            worksheet.Cell(row, 4).Style.Font.Bold = true;
            worksheet.Cell(row, 5).Value = totalSellerPayout;
            worksheet.Cell(row, 5).Style.Font.Bold = true;
            worksheet.Cell(row, 6).Value = totalTax;
            worksheet.Cell(row, 6).Style.Font.Bold = true;

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
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(1.5f, QuestUnit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

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
                    column.Item().Text("BÁO CÁO TÀI CHÍNH (DOANH THU SÀN)").FontSize(18).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text($"Từ ngày: {startDate:dd/MM/yyyy} - Đến ngày: {endDate:dd/MM/yyyy}").FontSize(11);
                    column.Item().Text("VAT 8% tính trên chiết khấu sàn, không trên GMV.").FontSize(9).FontColor(Colors.Grey.Medium);
                    column.Item().Text($"Ngày xuất: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Colors.Grey.Medium);
                });
            });
        }

        private void ComposeContent(IContainer container, IEnumerable<ReportItemDto> reportData)
        {
            container.PaddingVertical(0.8f, QuestUnit.Centimetre).Column(column =>
            {
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.1f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.2f);
                        columns.RelativeColumn(1.1f);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(CellStyle).Text("Mã đơn");
                        header.Cell().Element(CellStyle).Text("Ngày tạo");
                        header.Cell().Element(CellStyle).Text("GMV");
                        header.Cell().Element(CellStyle).Text("Chiết khấu sàn");
                        header.Cell().Element(CellStyle).Text("Trả seller");
                        header.Cell().Element(CellStyle).Text("VAT 8%");

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        }
                    });

                    decimal totalGmv = 0;
                    decimal totalCommission = 0;
                    decimal totalSellerPayout = 0;
                    decimal totalTax = 0;

                    foreach (var item in reportData)
                    {
                        var idStr = item.Id.ToString();
                        idStr = idStr.Length > 8 ? idStr.Substring(0, 8) : idStr;

                        table.Cell().Element(CellStyle).Text(idStr);
                        table.Cell().Element(CellStyle).Text(item.CreatedAt.ToString("dd/MM/yyyy"));
                        table.Cell().Element(CellStyle).Text(item.TotalAmount.ToString("N0"));
                        table.Cell().Element(CellStyle).Text(item.PlatformCommission.ToString("N0"));
                        table.Cell().Element(CellStyle).Text(item.SellerPayout.ToString("N0"));
                        table.Cell().Element(CellStyle).Text(item.Tax.ToString("N0"));

                        totalGmv += item.TotalAmount;
                        totalCommission += item.PlatformCommission;
                        totalSellerPayout += item.SellerPayout;
                        totalTax += item.Tax;

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                        }
                    }

                    table.Cell().Element(FooterCellStyle).Text("Tổng cộng:");
                    table.Cell().Element(FooterCellStyle).Text("");
                    table.Cell().Element(FooterCellStyle).Text(totalGmv.ToString("N0"));
                    table.Cell().Element(FooterCellStyle).Text(totalCommission.ToString("N0"));
                    table.Cell().Element(FooterCellStyle).Text(totalSellerPayout.ToString("N0"));
                    table.Cell().Element(FooterCellStyle).Text(totalTax.ToString("N0"));

                    static IContainer FooterCellStyle(IContainer container)
                    {
                        return container.BorderTop(1).BorderColor(Colors.Black).PaddingVertical(5).DefaultTextStyle(x => x.SemiBold());
                    }
                });
            });
        }
    }
}
