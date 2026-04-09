import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import ProductForm from "@/components/ProductForm";
import NomenclatureDetails from "@/components/NomenclatureDetails";
import func2url from "../../backend/func2url.json";

interface NomenclatureItem {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  base_price: number;
  wholesale_price: number;
  watts: number;
  products_count: number;
  min_retail: number;
  max_retail: number;
  created_at: string;
}

interface CatalogPageProps {
  onBack: () => void;
}

export default function CatalogPage({ onBack }: CatalogPageProps) {
  const [items, setItems] = useState<NomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(func2url["get-nomenclature"]);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function handleSuccess() {
    setShowForm(false);
    loadItems();
  }

  function formatPrice(v: number) {
    return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  if (selectedId !== null) {
    return <NomenclatureDetails nomenclatureId={selectedId} onBack={() => { setSelectedId(null); loadItems(); }} />;
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
            Добавить товар
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
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
              Добавить первый товар
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedId(n.id)}
                className="auth-glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all group text-left"
              >
                <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                  {n.image_url ? (
                    <img
                      src={n.image_url}
                      alt={n.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Image" size={40} className="text-muted-foreground/30" />
                    </div>
                  )}
                  {n.products_count > 0 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-primary/90 text-primary-foreground text-xs font-bold">
                      {n.products_count}
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{n.name}</h3>
                  {n.article && <p className="text-xs text-muted-foreground truncate">Арт. {n.article}</p>}
                  <div className="space-y-1 pt-1">
                    <div className="flex flex-wrap justify-between text-xs gap-x-1">
                      <span className="text-muted-foreground">Базовая</span>
                      <span className="text-foreground font-medium truncate">{formatPrice(n.base_price)} &#8381;</span>
                    </div>
                    <div className="flex flex-wrap justify-between text-xs gap-x-1">
                      <span className="text-muted-foreground">Оптовая</span>
                      <span className="text-foreground font-medium truncate">{formatPrice(n.wholesale_price)} &#8381;</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}