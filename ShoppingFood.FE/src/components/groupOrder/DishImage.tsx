import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

/** Ảnh món có fallback khi URL lỗi / không có ảnh. */
export function DishImage({ src, alt, className }: { src?: string | null; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} bg-orange-50 flex items-center justify-center`}>
        <ShoppingBag className="w-1/2 h-1/2 text-orange-300" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={`${className} object-cover`} onError={() => setFailed(true)} />;
}
