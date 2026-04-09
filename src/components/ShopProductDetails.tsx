import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface Nomenclature {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  base_price: number;
  wholesale_price: number;
  watts: number;
}

interface ProductItem {
  id: number;
  condition: string;
  condition_image_url: string;
  price_retail: number;
}

interface ShopProductDetailsProps {
  productId: number;
  onBack: () => void;
}

const CONDITION_ORDER = ["новый", "как новый", "отличный", "хороший"];

export default function ShopProductDetails({ productId, onBack }: ShopProductDetailsProps) {
  const [nomenclature, setNomenclature] = useState<Nomenclature | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${func2url["customer-product-details"]}?id=${productId}`);
        const data = await res.json();
        setNomenclature(data.nomenclature || null);
        setProducts(data.products || []);
      } catch {
        setNomenclature(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  function conditionBadgeColor(c: string) {
    if (c === "новый") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (c === "как новый") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (c === "отличный") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (c === "хороший") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-gray-500/15 text-gray-400 border-gray-500/30";
  }

  function formatPrice(v: number) {
    return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  const groups = CONDITION_ORDER
    .map((cond) => {
      const items = products.filter((p) => p.condition === cond);
      if (items.length === 0) return null;
      const prices = items.map((i) => i.price_retail).filter((p) => p > 0);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const preview = items.find((i) => i.condition_image_url)?.condition_image_url || "";
      return { condition: cond, items, minPrice, maxPrice, preview };
    })
    .filter(Boolean) as { condition: string; items: ProductItem[]; minPrice: number; maxPrice: number; preview: string }[];

  const allPrices = products.map((p) => p.price_retail).filter((p) => p > 0);
  const minRetail = allPrices.length ? Math.min(...allPrices) : 0;
  const maxRetail = allPrices.length ? Math.max(...allPrices) : 0;

  return (
    <div className="min-h-screen bg-background animate-fade-in shop-theme">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="font-bold text-foreground truncate">
            {nomenclature?.name || "Товар"}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !nomenclature ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Товар не найден</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            <div
              className="auth-glass rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => nomenclature.image_url && setZoomImage(nomenclature.image_url)}
            >
              <div className="aspect-square bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                {nomenclature.image_url ? (
                  <img
                    src={nomenclature.image_url}
                    alt={nomenclature.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <Icon name="Image" size={60} className="text-muted-foreground/20" />
                )}
                {nomenclature.image_url && (
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-secondary/80 border border-border flex items-center justify-center">
                    <Icon name="ZoomIn" size={14} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground leading-tight">{nomenclature.name}</h2>
              {nomenclature.article && (
                <p className="text-sm text-muted-foreground">Арт. {nomenclature.article}</p>
              )}
              {nomenclature.description && (
                <p className="text-sm text-foreground/80 leading-relaxed">{nomenclature.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {nomenclature.watts > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border text-xs">
                    <Icon name="Zap" size={12} className="text-primary" />
                    <span className="text-foreground font-medium">{nomenclature.watts} Вт</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-xs">
                  <Icon name="Package" size={12} className="text-primary" />
                  <span className="text-foreground font-medium">В наличии: {products.length} шт</span>
                </div>
              </div>
            </div>

            <div className="auth-glass rounded-2xl p-4 space-y-1">
              <p className="text-primary font-bold text-2xl">
                {minRetail === maxRetail
                  ? `${formatPrice(minRetail)} ₽`
                  : `${formatPrice(minRetail)} – ${formatPrice(maxRetail)} ₽`}
              </p>
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(nomenclature.base_price)} ₽
              </p>
            </div>

            {groups.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Доступные товары
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {groups.map((g) => (
                    <div
                      key={g.condition}
                      className="auth-glass rounded-2xl overflow-hidden"
                    >
                      <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                        {g.preview ? (
                          <img
                            src={g.preview}
                            alt={g.condition}
                            className="w-full h-full object-contain p-2 cursor-pointer"
                            onClick={() => setZoomImage(g.preview)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="Image" size={32} className="text-muted-foreground/20" />
                          </div>
                        )}
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg border text-[11px] font-medium ${conditionBadgeColor(g.condition)}`}>
                          {g.condition.charAt(0).toUpperCase() + g.condition.slice(1)}
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-primary/90 text-primary-foreground text-[11px] font-bold">
                          {g.items.length} шт
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-primary font-bold text-sm">
                          {g.minPrice === g.maxPrice
                            ? `${formatPrice(g.minPrice)} ₽`
                            : `${formatPrice(g.minPrice)}–${formatPrice(g.maxPrice)} ₽`}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-through">
                          {formatPrice(nomenclature.base_price)} ₽
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Icon name="MessageCircle" size={18} />
              Хочу купить
            </button>
          </div>
        )}
      </main>

      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setZoomImage(null)}
          >
            <Icon name="X" size={20} />
          </button>
          <img
            src={zoomImage}
            alt=""
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}