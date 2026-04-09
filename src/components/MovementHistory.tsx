import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface Movement {
  id: number;
  product_id: number;
  movement_type: string;
  condition_before: string;
  condition_after: string;
  comment: string;
  created_at: string;
}

interface MovementHistoryProps {
  nomenclatureId: number;
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  sold: { label: "Продано", icon: "ShoppingCart", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  written_off: { label: "Списано", icon: "Trash2", color: "text-red-400 bg-red-500/15 border-red-500/30" },
  transferred: { label: "Передано", icon: "Send", color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  condition_changed: { label: "Смена состояния", icon: "RefreshCw", color: "text-amber-400 bg-amber-500/15 border-amber-500/30" },
};

export default function MovementHistory({ nomenclatureId }: MovementHistoryProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${func2url["product-movement"]}?nomenclature_id=${nomenclatureId}`);
        const data = await res.json();
        setMovements(data.movements || []);
      } catch {
        setMovements([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [nomenclatureId]);

  function formatDate(s: string) {
    try {
      const d = new Date(s);
      return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return s;
    }
  }

  const visible = expanded ? movements : movements.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">История движений ({movements.length})</h3>
        {movements.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? "Свернуть" : "Показать все"}
          </button>
        )}
      </div>
      {loading ? (
        <div className="auth-glass rounded-2xl p-6 text-center">
          <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <div className="auth-glass rounded-2xl p-6 text-center">
          <p className="text-muted-foreground text-xs">Движений пока не было</p>
        </div>
      ) : (
        <div className="auth-glass rounded-2xl divide-y divide-border overflow-hidden">
          {visible.map((m) => {
            const info = TYPE_LABELS[m.movement_type] || { label: m.movement_type, icon: "Circle", color: "" };
            return (
              <div key={m.id} className="p-3 flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${info.color}`}>
                  <Icon name={info.icon} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{info.label}</span>
                    {m.movement_type === "condition_changed" && (
                      <span className="text-xs text-muted-foreground">
                        {m.condition_before} → {m.condition_after}
                      </span>
                    )}
                    {m.movement_type !== "condition_changed" && m.condition_before && (
                      <span className="text-xs text-muted-foreground">({m.condition_before})</span>
                    )}
                  </div>
                  {m.comment && <p className="text-xs text-foreground/70 mt-0.5 line-clamp-2">{m.comment}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(m.created_at)} · ID #{m.product_id}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
