import Icon from "@/components/ui/icon";
import { findMixedWords, normalizeText } from "@/lib/normalize";

interface FieldDiff {
  label: string;
  original: string;
  normalized: string;
  changes: { original: string; normalized: string }[];
}

interface NormalizeDialogProps {
  fields: FieldDiff[];
  onApply: (normalizedTexts: Record<string, string>) => void;
  onKeepOriginal: () => void;
  onCancel: () => void;
  reconsiderMode?: boolean;
}

function HighlightedWord({
  word,
  compare,
  mode,
}: {
  word: string;
  compare: string;
  mode: "original" | "normalized";
}) {
  const colorClass =
    mode === "original"
      ? "text-red-400 bg-red-500/20 rounded px-0.5"
      : "text-emerald-400 bg-emerald-500/20 rounded px-0.5";

  const chars = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const differs = i < compare.length && ch !== compare[i];
    if (differs) {
      chars.push(
        <span key={i} className={colorClass}>
          {ch}
        </span>
      );
    } else {
      chars.push(<span key={i}>{ch}</span>);
    }
  }

  return <span className="font-mono text-sm">{chars}</span>;
}

export default function NormalizeDialog({
  fields,
  onApply,
  onKeepOriginal,
  onCancel,
  reconsiderMode,
}: NormalizeDialogProps) {
  const fieldsWithChanges = fields.filter((f) => f.changes.length > 0);

  function handleApply() {
    const result: Record<string, string> = {};
    for (const field of fields) {
      result[field.label] = field.normalized;
    }
    onApply(result);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg bg-background border border-border rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon name="Languages" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {reconsiderMode ? "Рассмотреть снова?" : "Обнаружены смешанные символы"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {reconsiderMode
                  ? "Ранее вы решили оставить эти символы как есть. Хотите пересмотреть?"
                  : "В тексте найдены слова, где перепутаны кириллица и латиница"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Fields with changes */}
        <div className="space-y-4">
          {fieldsWithChanges.map((field) => (
            <div key={field.label}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {field.label}
              </p>
              <div className="rounded-2xl border border-border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-2 bg-secondary/50">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border">
                    Было
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Станет
                  </div>
                </div>
                {/* Table rows */}
                {field.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-2 ${
                      idx < field.changes.length - 1
                        ? "border-b border-border"
                        : ""
                    }`}
                  >
                    <div className="px-3 py-2.5 border-r border-border bg-red-500/5">
                      <HighlightedWord
                        word={change.original}
                        compare={change.normalized}
                        mode="original"
                      />
                    </div>
                    <div className="px-3 py-2.5 bg-emerald-500/5 flex items-center gap-2">
                      <HighlightedWord
                        word={change.normalized}
                        compare={change.original}
                        mode="normalized"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="Check" size={16} />
            Применить и сохранить
          </button>
          <button
            type="button"
            onClick={onKeepOriginal}
            className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-secondary/70 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="ShieldOff" size={16} />
            Оставить как есть
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-4 py-2.5 rounded-xl text-muted-foreground text-sm font-medium hover:text-foreground transition-all"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}