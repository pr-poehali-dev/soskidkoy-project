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
  created_at: string;
}

interface NomenclatureDetailsProps {
  nomenclatureId: number;
  onBack: () => void;
}

export default function NomenclatureDetails({ nomenclatureId, onBack }: NomenclatureDetailsProps) {
  const [nomenclature, setNomenclature] = useState<Nomenclature | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${func2url["get-nomenclature-products"]}?nomenclature_id=${nomenclatureId}`);
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
  }, [nomenclatureId]);

  function conditionBadgeColor(c: string) {
    if (c === "новый") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (c === "как новый") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (c === "отличный") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (c === "хороший") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (c === "под ремонт") return "bg-gray-500/15 text-gray-400 border-gray-500/30";
    if (c === "утиль") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }

  function formatPrice(v: number) {
    return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="font-bold text-foreground">Карточка номенклатуры</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !nomenclature ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Номенклатура не найдена</p>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            <div className="auth-glass rounded-2xl overflow-hidden">
              <div className="grid md:grid-cols-[280px_1fr] gap-4 p-4">
                <div className="aspect-square bg-secondary/50 rounded-xl overflow-hidden flex items-center justify-center">
                  {nomenclature.image_url ? (
                    <img src={nomenclature.image_url} alt={nomenclature.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Icon name="Image" size={40} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{nomenclature.name}</h2>
                    {nomenclature.article && (
                      <p className="text-sm text-muted-foreground mt-1">Арт. {nomenclature.article}</p>
                    )}
                  </div>
                  {nomenclature.description && (
                    <p className="text-sm text-foreground/80 leading-relaxed">{nomenclature.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {nomenclature.watts > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border text-xs">
                        <Icon name="Zap" size={12} className="text-primary" />
                        <span className="text-foreground font-medium">{nomenclature.watts} Вт</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Базовая цена</span>
                      <span className="text-foreground font-semibold">{formatPrice(nomenclature.base_price)} &#8381;</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Оптовая цена</span>
                      <span className="text-foreground font-semibold">{formatPrice(nomenclature.wholesale_price)} &#8381;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Характеристики ({products.length})
              </h3>
              {products.length === 0 ? (
                <div className="auth-glass rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground text-sm">Нет доступных характеристик</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div key={p.id} className="auth-glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                      <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                        {p.condition_image_url ? (
                          <img
                            src={p.condition_image_url}
                            alt={p.condition}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="Image" size={40} className="text-muted-foreground/30" />
                          </div>
                        )}
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg border text-xs font-medium ${conditionBadgeColor(p.condition)}`}>
                          {p.condition.charAt(0).toUpperCase() + p.condition.slice(1)}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">Розничная</p>
                        <p className="text-primary font-bold text-sm sm:text-base truncate">{formatPrice(p.price_retail)} &#8381;</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}