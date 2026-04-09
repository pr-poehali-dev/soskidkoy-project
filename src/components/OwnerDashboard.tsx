import { useState } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

interface AuthUser {
  id: number;
  phone: string;
  role: "owner" | "admin";
  createdAt: string;
}

interface Admin {
  id: number;
  phone: string;
  role: "owner" | "admin";
  createdAt: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  let d = digits;
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;
  d = d.slice(0, 11);

  let result = "+7";
  if (d.length > 1) result += " (" + d.slice(1, 4);
  if (d.length >= 4) result += ") " + d.slice(4, 7);
  if (d.length >= 7) result += "-" + d.slice(7, 9);
  if (d.length >= 9) result += "-" + d.slice(9, 11);
  return result;
}

export default function OwnerDashboard({
  user,
  admins,
  onLogout,
  onDelete,
  onCreate,
}: {
  user: AuthUser;
  admins: Admin[];
  onLogout: () => void;
  onDelete: (id: number) => void;
  onCreate: (phone: string, password: string) => Promise<string | null>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState("");
  const [pushError, setPushError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = newPhone.replace(/\D/g, "");
    if (digits.length < 11) { setFormError("Введите корректный номер"); return; }
    if (newPassword.length < 8) { setFormError("Пароль минимум 8 символов"); return; }
    setFormLoading(true);
    setFormError("");
    const err = await onCreate(formatPhone(newPhone), newPassword);
    setFormLoading(false);
    if (err) { setFormError(err); return; }
    setShowForm(false);
    setNewPhone("");
    setNewPassword("");
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Icon name="Shield" size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Панель владельца</h1>
              <p className="text-muted-foreground text-xs mt-0.5">{user.phone}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
          >
            <Icon name="LogOut" size={14} />
            Выйти
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Администраторы</h2>
            <p className="text-muted-foreground text-sm">
              Всего: {admins.length} • Админов: {admins.filter((a) => a.role === "admin").length}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setFormError(""); }}
            className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Icon name={showForm ? "X" : "UserPlus"} size={14} />
            {showForm ? "Отмена" : "Добавить"}
          </button>
        </div>

        {showForm && (
          <div className="auth-glass rounded-2xl p-5 mb-5 animate-slide-up">
            <h3 className="font-semibold text-foreground text-sm mb-4">Новый администратор</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => { setNewPhone(formatPhone(e.target.value)); setFormError(""); }}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full pl-9 pr-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
              </div>
              <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Lock" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setFormError(""); }}
                  placeholder="Пароль (мин. 8 символов)"
                  className="w-full pl-9 pr-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
              </div>
              {formError && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2.5 border border-destructive/20">
                  <Icon name="AlertCircle" size={14} />
                  {formError}
                </div>
              )}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {formLoading && <Icon name="Loader2" size={16} className="animate-spin" />}
                Создать администратора
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {admins.map((admin, index) => (
            <div
              key={admin.id}
              className="auth-glass rounded-2xl p-4 flex items-center justify-between animate-slide-up"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${admin.role === "owner"
                      ? "bg-primary/15 border border-primary/30"
                      : "bg-secondary border border-border"
                    }`}
                >
                  {admin.role === "owner" ? (
                    <Icon name="Crown" size={16} className="text-primary" />
                  ) : (
                    <Icon name="UserCircle" size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">{admin.phone}</p>
                    {admin.role === "owner" && (
                      <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">
                        Владелец
                      </span>
                    )}
                    {admin.role === "admin" && (
                      <span className="text-[10px] bg-secondary text-muted-foreground border border-border rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">
                        Админ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Добавлен: {admin.createdAt}</p>
                </div>
              </div>

              {admin.role !== "owner" && (
                <button
                  onClick={() => onDelete(admin.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Icon name="Trash2" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {admins.filter((a) => a.role === "admin").length === 0 && !showForm && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Icon name="UserPlus" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Нажмите «Добавить» чтобы создать первого администратора</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Пуш-уведомления</h2>
          <div className="auth-glass rounded-2xl p-5 space-y-3">
            <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name="Type" size={16} className="text-muted-foreground" />
              </span>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => { setPushTitle(e.target.value); setPushError(""); setPushResult(""); }}
                placeholder="Заголовок"
                className="w-full pl-9 pr-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
              />
            </div>
            <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
              <span className="absolute left-3 top-3">
                <Icon name="MessageSquare" size={16} className="text-muted-foreground" />
              </span>
              <textarea
                value={pushMessage}
                onChange={(e) => { setPushMessage(e.target.value); setPushError(""); setPushResult(""); }}
                placeholder="Текст уведомления"
                rows={3}
                className="w-full pl-9 pr-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm resize-none"
              />
            </div>
            {pushError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2.5 border border-destructive/20">
                <Icon name="AlertCircle" size={14} />
                {pushError}
              </div>
            )}
            {pushResult && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 rounded-xl px-3 py-2.5 border border-emerald-500/20">
                <Icon name="Check" size={14} />
                {pushResult}
              </div>
            )}
            <button
              type="button"
              disabled={pushSending}
              onClick={async () => {
                if (!pushTitle.trim() || !pushMessage.trim()) { setPushError("Заполните заголовок и текст"); return; }
                setPushSending(true);
                setPushError("");
                setPushResult("");
                try {
                  const res = await fetch(func2url["push-send"], {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-User-Role": "owner" },
                    body: JSON.stringify({ title: pushTitle.trim(), message: pushMessage.trim() }),
                  });
                  const data = await res.json();
                  if (!res.ok) { setPushError(data.error || "Ошибка отправки"); return; }
                  setPushResult(`Отправлено: ${data.sent}, ошибок: ${data.failed}`);
                  setPushTitle("");
                  setPushMessage("");
                } catch { setPushError("Ошибка сети"); } finally { setPushSending(false); }
              }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pushSending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Bell" size={16} />}
              Отправить уведомление
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
