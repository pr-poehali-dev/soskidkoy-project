import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import ProductForm from "@/components/ProductForm";
import func2url from "../../backend/func2url.json";

interface Product {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  condition: string;
  condition_image_url: string;
  base_price: number;
  wholesale_price: number;
  price_retail: number;
  watts: number;
  nomenclature_id: number;
  created_at: string;
}

interface CatalogPageProps {
  onBack: () => void;
}

export default function CatalogPage({ onBack }: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch(func2url["get-products"]);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleSuccess() {
    setShowForm(false);
    loadProducts();
  }

  function conditionBadgeColor(c: string) {
    if (c === "как новый") return "bg-green-500/15 text-green-400 border-green-500/30";
    if (c === "отличный") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }

  function formatPrice(v: number) {
    return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ProductForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h1 className="font-bold text-foreground">Номенклатура</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
          >
            <Icon name="Plus" size={16} />
            Создать карточку
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border mb-4">
              <Icon name="Package" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">Номенклатура пуста</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all"
            >
              <Icon name="Plus" size={16} />
              Создать первую карточку
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="auth-glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all group">
                <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                  {(p.condition_image_url || p.image_url) ? (
                    <img
                      src={p.condition_image_url || p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{p.name}</h3>
                  {p.article && <p className="text-xs text-muted-foreground">Арт. {p.article}</p>}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Базовая</span>
                      <span className="text-foreground font-medium">{formatPrice(p.base_price)} &#8381;</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Розничная</span>
                      <span className="text-primary font-medium">{formatPrice(p.price_retail)} &#8381;</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Оптовая</span>
                      <span className="text-foreground font-medium">{formatPrice(p.wholesale_price)} &#8381;</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
