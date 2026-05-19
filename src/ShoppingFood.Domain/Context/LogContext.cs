using Microsoft.EntityFrameworkCore;
using ShoppingFood.Domain.Models;

namespace ShoppingFood.Domain.Context
{
    public class LogContext : DbContext
    {
        public LogContext(DbContextOptions<LogContext> options) : base(options)
        {
        }

        public DbSet<ActionLog> ActionLogs { get; set; } = null!;
        public DbSet<ErrorLog> ErrorLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Set default schema for this context to "log"
            modelBuilder.HasDefaultSchema("log");

            modelBuilder.Entity<ActionLog>(entity =>
            {
                entity.ToTable("ActionLogs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Message).IsRequired();
            });

            modelBuilder.Entity<ErrorLog>(entity =>
            {
                entity.ToTable("ErrorLogs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ExceptionMessage).IsRequired();
            });
        }
    }
}
