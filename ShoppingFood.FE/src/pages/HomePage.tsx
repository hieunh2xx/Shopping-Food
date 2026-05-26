import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChefHat, Truck, Shield, Star } from 'lucide-react';
import { useProducts } from '../hooks';
import { ProductList } from '../components/product/ProductList';
import { ROUTES } from '../routes/routeConfig';

export function HomePage() {
  const { bestSellers, fetchBestSellers, isLoading } = useProducts();

  useEffect(() => {
    fetchBestSellers(8);
  }, [fetchBestSellers]);

  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-gray-950 to-gray-950" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Giao hÃ ng siÃªu tá»‘c 30 phÃºt
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Äáº·t mÃ³n ngon
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                chá»‰ trong vÃ i giÃ¢y
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              KhÃ¡m phÃ¡ hÃ ng ngÃ n nhÃ  hÃ ng, quÃ¡n Äƒn ngon nháº¥t. Äáº·t hÃ ng dá»… dÃ ng, giao táº­n nÆ¡i nhanh chÃ³ng.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to={ROUTES.PRODUCTS}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-gray-900 font-medium shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-105 active:scale-[0.98]"
              >
                Xem thá»±c Ä‘Æ¡n
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.REGISTER_SELLER}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-100/50 font-medium transition-all"
              >
                Trá»Ÿ thÃ nh Ä‘á»‘i tÃ¡c
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: ChefHat, label: '1000+ NhÃ  hÃ ng', desc: 'Äa dáº¡ng áº©m thá»±c', color: 'orange' },
            { icon: Truck, label: 'Giao nhanh 30p', desc: 'LuÃ´n nÃ³ng há»•i', color: 'blue' },
            { icon: Shield, label: 'Thanh toÃ¡n an toÃ n', desc: 'Báº£o máº­t tuyá»‡t Ä‘á»‘i', color: 'green' },
            { icon: Star, label: 'ÄÃ¡nh giÃ¡ thá»±c', desc: 'Tá»« khÃ¡ch hÃ ng', color: 'yellow' },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-5 rounded-2xl bg-white/50 border border-gray-200/50 hover:border-gray-300 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{feature.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">MÃ³n bÃ¡n cháº¡y</h2>
            <p className="text-sm text-gray-500 mt-1">ÄÆ°á»£c yÃªu thÃ­ch nháº¥t tuáº§n nÃ y</p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            Xem táº¥t cáº£
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ProductList products={bestSellers} isLoading={isLoading} emptyMessage="ChÆ°a cÃ³ dá»¯ liá»‡u sáº£n pháº©m" />
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 lg:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="relative max-w-lg">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              Trá»Ÿ thÃ nh Ä‘á»‘i tÃ¡c bÃ¡n hÃ ng
            </h3>
            <p className="text-orange-100 mb-6">
              Tiáº¿p cáº­n hÃ ng triá»‡u khÃ¡ch hÃ ng tiá»m nÄƒng. ÄÄƒng kÃ½ ngay hÃ´m nay vÃ  báº¯t Ä‘áº§u kinh doanh.
            </p>
            <Link
              to={ROUTES.REGISTER_SELLER}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-600 font-semibold hover:bg-orange-50 transition-colors shadow-lg"
            >
              ÄÄƒng kÃ½ ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
