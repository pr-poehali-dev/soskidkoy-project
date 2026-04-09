import { useState } from "react";
import Icon from "@/components/ui/icon";
import PhotoPicker from "@/components/PhotoPicker";
import NormalizeDialog from "@/components/NormalizeDialog";
import { findMixedWords, normalizeText } from "@/lib/normalize";
import func2url from "../../backend/func2url.json";

interface NomenclatureData {
  id: number;
  name: string;
  article: string;
  description: string;
  image_url: string;
  base_price: number;
  wholesale_price: number;
  watts: number;
  normalization_status?: string;
}

interface NomenclatureEditFormProps {
  data: NomenclatureData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NomenclatureEditForm({ data, onSuccess, onCancel }: NomenclatureEditFormProps) {
  const [name, setName] = useState(data.name);
  const [article, setArticle] = useState(data.article);
  const [description, setDescription] = useState(data.description);
  const [imageBase64, setImageBase64] = useState(data.image_url);
  const [basePrice, setBasePrice] = useState(data.base_price ? String(data.base_price) : "");
  const [wholesalePrice, setWholesalePrice] = useState(data.wholesale_price ? String(data.wholesale_price) : "");
  const [watts, setWatts] = useState(data.watts ? String(data.watts) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [normalizeFields, setNormalizeFields] = useState<{ label: string; original: string; normalized: string; changes: { original: string; normalized: string }[] }[] | null>(null);
  const [reconsiderMode, setReconsiderMode] = useState(false);
  const wasKeptOriginal = data.normalization_status === "kept_original";

  async function uploadImage(base64: string): Promise<string> {
    if (base64.startsWith("http")) return base64;
    const res = await fetch(func2url["upload-image"], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });
    const d = await res.json();
    return d.url;
  }

  function checkAndSave(nameVal: string, articleVal: string) {
    const nameChanges = findMixedWords(nameVal);
    const articleChanges = findMixedWords(articleVal);

    if (nameChanges.length === 0 && articleChanges.length === 0) {
      doSave(nameVal, articleVal, "normalized");
      return;
    }

    const fields = [];
    if (nameChanges.length > 0) {
      fields.push({
        label: "Название",
        original: nameVal,
        normalized: normalizeText(nameVal),
        changes: nameChanges.map((c) => ({ original: c.original, normalized: c.normalized })),
      });
    }
    if (articleChanges.length > 0) {
      fields.push({
        label: "Артикул",
        original: articleVal,
        normalized: normalizeText(articleVal),
        changes: articleChanges.map((c) => ({ original: c.original, normalized: c.normalized })),
      });
    }
    setReconsiderMode(false);
    setNormalizeFields(fields);
  }

  function openReconsider() {
    const nameChanges = findMixedWords(name.trim());
    const articleChanges = findMixedWords(article.trim());
    if (nameChanges.length === 0 && articleChanges.length === 0) {
      alert("Смешанных символов больше нет.");
      return;
    }
    const fields = [];
    if (nameChanges.length > 0) {
      fields.push({ label: "Название", original: name.trim(), normalized: normalizeText(name.trim()), changes: nameChanges.map((c) => ({ original: c.original, normalized: c.normalized })) });
    }
    if (articleChanges.length > 0) {
      fields.push({ label: "Артикул", original: article.trim(), normalized: normalizeText(article.trim()), changes: articleChanges.map((c) => ({ original: c.original, normalized: c.normalized })) });
    }
    setReconsiderMode(true);
    setNormalizeFields(fields);
  }

  async function doSave(nameVal: string, articleVal: string, status: "normalized" | "kept_original") {
    setSaving(true);
    setError("");
    try {
      let imageUrl = imageBase64;
      if (imageBase64 && !imageBase64.startsWith("http")) {
        imageUrl = await uploadImage(imageBase64);
      }

      const res = await fetch(func2url["update-nomenclature"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            id: data.id,
            name: nameVal.trim(),
            article: articleVal.trim(),
            description: description.trim(),
            image_url: imageUrl || "",
            base_price: parseFloat(basePrice) || 0,
            wholesale_price: parseFloat(wholesalePrice) || 0,
            watts: parseInt(watts) || 0,
            normalization_status: status,
          }],
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Ошибка сохранения");
        return;
      }
      onSuccess();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Введите название"); return; }
    checkAndSave(name.trim(), article.trim());
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-foreground">Редактирование номенклатуры</h2>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {wasKeptOriginal && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
            <Icon name="AlertTriangle" size={16} className="text-amber-400 flex-shrink-0" />
            <span className="text-foreground flex-1">Символы оставлены как есть</span>
            <button type="button" onClick={openReconsider} className="text-amber-400 hover:text-amber-300 text-xs font-medium whitespace-nowrap">
              Проверить снова
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Название</label>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Артикул</label>
          <input
            value={article}
            onChange={(e) => { setArticle(e.target.value); setError(""); }}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Фото</label>
          <PhotoPicker value={imageBase64} onChange={setImageBase64} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Базовая цена</label>
            <input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Оптовая цена</label>
            <input
              type="number"
              step="0.01"
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Мощность (Вт)</label>
          <input
            type="number"
            value={watts}
            onChange={(e) => setWatts(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/40"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2.5 border border-destructive/20">
            <Icon name="AlertCircle" size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-secondary/70 transition-all">
            Отмена
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50">
            {saving ? "..." : "Сохранить"}
          </button>
        </div>
      </form>

      {normalizeFields && (
        <NormalizeDialog
          fields={normalizeFields}
          reconsiderMode={reconsiderMode}
          onApply={(normalized) => {
            const n = normalized["Название"] || name.trim();
            const a = normalized["Артикул"] || article.trim();
            setName(n);
            setArticle(a);
            setNormalizeFields(null);
            doSave(n, a, "normalized");
          }}
          onKeepOriginal={() => {
            setNormalizeFields(null);
            doSave(name.trim(), article.trim(), "kept_original");
          }}
          onCancel={() => setNormalizeFields(null)}
        />
      )}
    </>
  );
}