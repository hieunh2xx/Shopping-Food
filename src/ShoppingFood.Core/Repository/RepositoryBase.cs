using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using ShoppingFood.Core.Interfaces;

namespace ShoppingFood.Core.Repository
{
    public class RepositoryBase<T> : IAsyncRepository<T> where T : class
    {
        protected readonly DbContext _dbContext;

        public RepositoryBase(DbContext dbContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        }

        public virtual async Task<T?> GetByIdAsync(Guid id) => await _dbContext.Set<T>().FindAsync(id);

        public virtual async Task<IReadOnlyList<T>> GetAllAsync() => await _dbContext.Set<T>().ToListAsync();

        public virtual async Task<IReadOnlyList<T>> GetAsync(Expression<Func<T, bool>> predicate) => 
            await _dbContext.Set<T>().Where(predicate).ToListAsync();

        public virtual async Task<IReadOnlyList<T>> GetAsync(
            Expression<Func<T, bool>>? predicate = null,
            Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
            Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null,
            int skip = 0,
            int take = 10,
            bool disableTracking = true)
        {
            IQueryable<T> query = _dbContext.Set<T>();
            if (disableTracking) query = query.AsNoTracking();
            if (include != null) query = include(query);
            if (predicate != null) query = query.Where(predicate);
            if (orderBy != null) return await orderBy(query).Skip(skip).Take(take).ToListAsync();
            return await query.Skip(skip).Take(take).ToListAsync();
        }

        public virtual async Task<int> GetCountAsync(Expression<Func<T, bool>>? predicate = null, Func<IQueryable<T>, IIncludableQueryable<T, object>>? include = null)
        {
            IQueryable<T> query = _dbContext.Set<T>();
            if (include != null) query = include(query);
            if (predicate != null) query = query.Where(predicate);
            return await query.CountAsync();
        }

        public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate) => 
            await _dbContext.Set<T>().AnyAsync(predicate);

        public virtual void Add(T entity) => _dbContext.Set<T>().Add(entity);

        public virtual void Update(T entity) => _dbContext.Entry(entity).State = EntityState.Modified;

        public virtual void Delete(T entity) => _dbContext.Set<T>().Remove(entity);
    }
}
