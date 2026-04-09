import { useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface ProductItem {
  id: number;
  condition: string;
  condition_image_url: string;
  price_retail: number;
}

interface ProductActionDialogProps {
  products: ProductItem[];
  condition: string;
  onClose: () => void;
  onDone: () => void;
}

type ActionType = "sold" | "written_off" | "transferred" | "condition_changed";

const CONDITIONS = [
  { value: "новый", label: "Новый" },
  { value: "как новый", label: "Как новый" },
  { value: "отличный", label: "Отличный" },
  { value: "хороший", label: "Хороший" },
  { value: "под ремонт", label: "Под ремонт" },
  { value: "утиль", label: "Утиль" },
];

const ACTIONS: { value: ActionType; label: string; icon: string; color: string }[] = [
  { value: "sold", label: "Продано", icon: "ShoppingCart", color: "emerald" },
  { value: "written_off", label: "Списано", icon: "Trash2", color: "red" },
  { value: "transferred", label: "Передано", icon: "Send", color: "blue" },
  { value: "condition_changed", label: "Изменить состояние", icon: "RefreshCw", color: "amber" },
];

export default function ProductActionDialog({ products, condition, onClose, onDone }: ProductActionDialogProps) {
  const [selectedId, setSelectedId] = useState<number | null>(products[0]?.id ?? null);
  const [action, setAction] = useState<ActionType | null>(null);
  const [comment, setComment] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function formatPrice(v: number) {
    return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  async function submit() {
    if (!selectedId || !action) {
      setError("Выбери товар и действие");
      return;
    }
    if (action === "condition_changed" && !newCondition) {
      setError("Выбери новое состояние");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(func2url["product-movement"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedId,
          movement_type: action,
          comment,
          new_condition: action === "condition_changed" ? newCondition : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка");
        setSubmitting(false);
        return;
      }
      onDone();
    } catch {
      setError("Ошибка сети");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background border border-border rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Действие: <span className="text-primary">{condition}</span>
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Выбери товар ({products.length} шт)</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${
                  selectedId === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                  {p.condition_image_url ? (
                    <img src={p.condition_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Image" size={16} className="text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">ID #{p.id}</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {formatPrice(p.price_retail)} ₽
                  </p>
                </div>
                {selectedId === p.id && <Icon name="Check" size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Действие</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAction(a.value)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                  action === a.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30 hover:bg-secondary/50"
                }`}
              >
                <Icon name={a.icon} size={18} className="text-foreground" />
                <span className="text-xs font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {action === "condition_changed" && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Новое состояние</p>
            <select
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Выбери...</option>
              {CONDITIONS.filter((c) => c.value !== condition).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-2">Комментарий (опционально)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            placeholder="Например: клиент Иванов"
          />
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-secondary/70 transition-all"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? "..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  );
}
