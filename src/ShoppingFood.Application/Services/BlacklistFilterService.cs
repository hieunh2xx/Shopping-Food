using ShoppingFood.Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ShoppingFood.Application.Services
{
    public class BlacklistFilterService
    {
        private readonly IBlacklistKeywordRepository _repo;

        public BlacklistFilterService(IBlacklistKeywordRepository repo)
        {
            _repo = repo;
        }

        public async Task<string> FilterContent(string content)
        {
            if (string.IsNullOrWhiteSpace(content)) return content;

            var keywords = await _repo.GetAsync(k => k.IsActive);
            foreach (var kw in keywords)
            {
                if (!string.IsNullOrWhiteSpace(kw.Keyword))
                {
                    content = Regex.Replace(content, Regex.Escape(kw.Keyword),
                        new string('*', kw.Keyword.Length), RegexOptions.IgnoreCase);
                }
            }
            return content;
        }
    }
}
