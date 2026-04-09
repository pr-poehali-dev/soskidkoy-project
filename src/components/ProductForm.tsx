import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import PhotoPicker from "@/components/PhotoPicker";
import func2url from "../../backend/func2url.json";

interface NomenclatureResult {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  base_price: number;
  wholesale_price: number;
  watts: number;
}

interface ProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState("");
  const [article, setArticle] = useState("");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [watts, setWatts] = useState("");
  const [condition, setCondition] = useState("");
  const [conditionImageBase64, setConditionImageBase64] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");

  const [nomenclatureId, setNomenclatureId] = useState<number | null>(null);
  const [nomLocked, setNomLocked] = useState(false);
  const [suggestions, setSuggestions] = useState<NomenclatureResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchBy, setSearchBy] = useState<"name" | "article">("name");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function searchNomenclature(query: string, by: "name" | "article") {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`${func2url["search-nomenclature"]}?q=${encodeURIComponent(query)}&by=${by}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(data.results?.length > 0);
    }, 300);
  }

  function handleNameChange(v: string) {
    setName(v);
    if (nomLocked) return;
    setSearchBy("name");
    searchNomenclature(v, "name");
  }

  function handleArticleChange(v: string) {
    setArticle(v);
    if (nomLocked) return;
    setSearchBy("article");
    searchNomenclature(v, "article");
  }

  function selectNomenclature(nom: NomenclatureResult) {
    setNomenclatureId(nom.id);
    setName(nom.name);
    setArticle(nom.article);
    setDescription(nom.description);
    setWatts(nom.watts ? String(nom.watts) : "");
    setBasePrice(nom.base_price ? String(nom.base_price) : "");
    setWholesalePrice(nom.wholesale_price ? String(nom.wholesale_price) : "");
    if (nom.image_url) setImageBase64(nom.image_url);
    setNomLocked(true);
    setShowSuggestions(false);
  }

  function resetNomenclature() {
    setNomenclatureId(null);
    setNomLocked(false);
    setName("");
    setArticle("");
    setDescription("");
    setImageBase64("");
    setWatts("");
    setBasePrice("");
    setWholesalePrice("");
  }

  async function uploadImage(base64: string): Promise<string> {
    if (base64.startsWith("http")) return base64;
    const res = await fetch(func2url["upload-image"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Введите название"); return; }
    if (!condition) { setError("Выберите характеристику"); return; }
    if (!retailPrice) { setError("Введите розничную цену"); return; }

    setSaving(true);
    try {
      let imageUrl = "";
      if (imageBase64 && !imageBase64.startsWith("http")) {
        imageUrl = await uploadImage(imageBase64);
      } else {
        imageUrl = imageBase64;
      }

      let condImageUrl = "";
      if (conditionImageBase64 && !conditionImageBase64.startsWith("http")) {
        condImageUrl = await uploadImage(conditionImageBase64);
      } else {
        condImageUrl = conditionImageBase64;
      }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        article: article.trim(),
        description: description.trim(),
        image_url: imageUrl,
        base_price: parseFloat(basePrice) || 0,
        wholesale_price: parseFloat(wholesalePrice) || 0,
        watts: parseInt(watts) || 0,
        condition,
        condition_image_url: condImageUrl,
        price_retail: parseFloat(retailPrice) || 0,
      };

      if (nomenclatureId) {
        payload.nomenclature_id = nomenclatureId;
      }

      const res = await fetch(func2url["create-product"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сохранения");
        return;
      }

      onSuccess();
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  }

  const conditions = [
    { value: "новый", label: "Новый" },
    { value: "как новый", label: "Как новый" },
    { value: "отличный", label: "Отличный" },
    { value: "хороший", label: "Хороший" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-foreground">Создание карточки товара</h2>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="X" size={20} />
        </button>
      </div>

      {nomLocked && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <Icon name="Link" size={14} className="text-primary" />
          <span className="text-foreground">Номенклатура найдена в базе</span>
          <button type="button" onClick={resetNomenclature} className="ml-auto text-muted-foreground hover:text-foreground">
            <Icon name="Unlink" size={14} />
          </button>
        </div>
      )}

      <div className="relative" ref={suggestionsRef}>
        <label className="block text-sm font-medium text-foreground mb-1.5">Название</label>
        <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Введите название товара"
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
            disabled={nomLocked}
          />
        </div>
        {showSuggestions && searchBy === "name" && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectNomenclature(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-secondary/80 text-sm text-foreground border-b border-border last:border-0 transition-colors"
              >
                <span className="font-medium">{s.name}</span>
                {s.article && <span className="text-muted-foreground ml-2">({s.article})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-1.5">Артикул</label>
        <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
          <input
            type="text"
            value={article}
            onChange={(e) => handleArticleChange(e.target.value)}
            placeholder="Введите артикул"
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
            disabled={nomLocked}
          />
        </div>
        {showSuggestions && searchBy === "article" && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectNomenclature(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-secondary/80 text-sm text-foreground border-b border-border last:border-0 transition-colors"
              >
                <span className="font-medium">{s.article}</span>
                <span className="text-muted-foreground ml-2">— {s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Описание</label>
        <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание товара"
            rows={3}
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm resize-none"
            disabled={nomLocked}
          />
        </div>
      </div>

      <PhotoPicker value={imageBase64} onChange={setImageBase64} label="Фото номенклатуры" disabled={nomLocked && !!imageBase64} />

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Мощность (Вт)</label>
        <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
          <input
            type="number"
            value={watts}
            onChange={(e) => setWatts(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
            disabled={nomLocked}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Характеристика</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {conditions.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                condition === c.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <PhotoPicker value={conditionImageBase64} onChange={setConditionImageBase64} label="Фото характеристики" />

      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-sm font-medium text-foreground">Цены</p>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Базовая цена</label>
          <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
            <input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
              disabled={nomLocked}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Оптовая цена</label>
          <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
            <input
              type="number"
              step="0.01"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
              disabled={nomLocked}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Розничная цена</label>
          <div className="input-focus rounded-xl border border-border bg-input overflow-hidden">
            <input
              type="number"
              step="0.01"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
      >
        {saving ? "Сохранение..." : "Создать карточку"}
      </button>
    </form>
  );
}