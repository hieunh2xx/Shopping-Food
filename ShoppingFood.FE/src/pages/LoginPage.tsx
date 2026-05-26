import { ChefHat } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes/routeConfig';

export function LoginPage() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left â€” Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-gray-950" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/20">
              <ChefHat className="w-7 h-7 text-gray-900" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Shopping Food</span>
          </Link>

          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
            ChÃ o má»«ng
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
              trá»Ÿ láº¡i!
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-md leading-relaxed">
            ÄÄƒng nháº­p Ä‘á»ƒ tráº£i nghiá»‡m Ä‘áº·t hÃ ng nhanh chÃ³ng vÃ  nháº­n nhiá»u Æ°u Ä‘Ã£i háº¥p dáº«n.
          </p>

          {/* Floating food icons */}
          <div className="mt-16 flex gap-4">
            {['ðŸ•', 'ðŸœ', 'ðŸ”', 'ðŸ¥—', 'ðŸ£'].map((emoji, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-2xl bg-gray-100/50 backdrop-blur-sm border border-gray-300/50 flex items-center justify-center text-2xl animate-bounce"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '2s' }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right â€” Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-6 h-6 text-gray-900" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Shopping Food
            </span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ÄÄƒng nháº­p</h1>
            <p className="text-sm text-gray-500">Nháº­p thÃ´ng tin tÃ i khoáº£n cá»§a báº¡n</p>
          </div>

          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 sm:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
