import { ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/routeConfig';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-gray-900" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                Shopping Food
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ná»n táº£ng Ä‘áº·t vÃ  giao nháº­n Ä‘á»“ Äƒn trá»±c tuyáº¿n hÃ ng Ä‘áº§u Viá»‡t Nam.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">KhÃ¡m phÃ¡</h4>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  Thá»±c Ä‘Æ¡n
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  NhÃ  hÃ ng
                </Link>
              </li>
              <li>
                <Link to={ROUTES.PRODUCTS} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  Khuyáº¿n mÃ£i
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Äá»‘i tÃ¡c</h4>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.REGISTER_SELLER} className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  ÄÄƒng kÃ½ bÃ¡n hÃ ng
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  Trá»Ÿ thÃ nh tÃ i xáº¿
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Há»— trá»£</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  Trung tÃ¢m trá»£ giÃºp
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  Äiá»u khoáº£n sá»­ dá»¥ng
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                  ChÃ­nh sÃ¡ch báº£o máº­t
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200/50 text-center">
          <p className="text-xs text-gray-600">
            Â© {new Date().getFullYear()} Shopping Food. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
