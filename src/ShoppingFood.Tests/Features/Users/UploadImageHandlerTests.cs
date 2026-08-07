using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using ShoppingFood.Application.Features.Users.Commands;
using ShoppingFood.Application.Interfaces;
using Xunit;

namespace ShoppingFood.Tests.Features.Users
{
    public class UploadImageHandlerTests
    {
        private readonly Mock<IPhotoService> _photoServiceMock;
        private readonly UploadImageHandler _handler;

        public UploadImageHandlerTests()
        {
            _photoServiceMock = new Mock<IPhotoService>();
            _handler = new UploadImageHandler(_photoServiceMock.Object);
        }

        private Mock<IFormFile> CreateMockFile(string fileName, long length = 100)
        {
            var mockFile = new Mock<IFormFile>();
            mockFile.Setup(f => f.FileName).Returns(fileName);
            mockFile.Setup(f => f.Length).Returns(length);
            return mockFile;
        }

        [Fact]
        public async Task Handle_FileIsNull_Returns400()
        {
            var command = new UploadImageCommand { File = null };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Không có file nào được tải lên.");
        }

        [Fact]
        public async Task Handle_FileIsEmpty_Returns400()
        {
            var mockFile = CreateMockFile("test.png", 0);
            var command = new UploadImageCommand { File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Không có file nào được tải lên.");
        }

        [Fact]
        public async Task Handle_InvalidExtension_Returns400()
        {
            var mockFile = CreateMockFile("test.exe");
            var command = new UploadImageCommand { File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(400);
            result.Message.Should().Be("Chỉ cho phép tải lên các tệp ảnh hoặc tài liệu (.jpg, .jpeg, .png, .webp, .pdf, .doc, .docx).");
        }

        [Fact]
        public async Task Handle_CloudinaryUploadFails_Returns500()
        {
            var mockFile = CreateMockFile("test.png");
            _photoServiceMock.Setup(s => s.AddPhotoAsync(It.IsAny<IFormFile>())).ReturnsAsync((string)null!);

            var command = new UploadImageCommand { File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(500);
            result.Message.Should().Be("Lỗi khi tải ảnh lên Cloudinary.");
        }

        [Fact]
        public async Task Handle_Success_Returns200()
        {
            var mockFile = CreateMockFile("test.png");
            var newUrl = "https://cloudinary.com/new_url.png";
            _photoServiceMock.Setup(s => s.AddPhotoAsync(It.IsAny<IFormFile>())).ReturnsAsync(newUrl);

            var command = new UploadImageCommand { File = mockFile.Object };
            var result = await _handler.Handle(command, CancellationToken.None);
            
            result.Code.Should().Be(200);
            result.Message.Should().Be("Tải ảnh lên thành công.");
            
            var data = result.Data as dynamic;
            // Testing dynamic return type from an anonymous object is tricky. 
            // Better to serialize/deserialize or use a specific dto, but since it's ApiResponse we can check that it succeeded.
        }
    }
}
