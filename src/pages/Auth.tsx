import { useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";
import CatalogPage from "@/components/CatalogPage";
import func2url from "../../backend/func2url.json";

type Mode = "login" | "register";

interface Admin {
  id: number;
  phone: string;
  role: "owner" | "admin";
  createdAt: string;
}

interface AuthUser {
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

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Слабый", color: "#ef4444" };
  if (score <= 2) return { score, label: "Средний", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Хороший", color: "#3b82f6" };
  return { score, label: "Надёжный", color: "#22c55e" };
}

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("admin_session");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.role === "admin") return parsed;
    }
    return null;
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    fetch(func2url["auth-register"])
      .then((r) => r.json())
      .then((data) => {
        setOwnerExists(data.ownerExists);
        if (!data.ownerExists) setMode("register");
      })
      .catch(() => setOwnerExists(false));
  }, []);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
    setError("");
  }

  function handlePhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const digits = phone.replace(/\D/g, "");
      if (digits.length <= 1) {
        e.preventDefault();
        setPhone("");
        return;
      }
      const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
      const textBefore = phone.slice(0, cursorPos);
      const digitsBefore = textBefore.replace(/\D/g, "").length;
      const charBefore = phone[cursorPos - 1];
      if (charBefore && /\D/.test(charBefore)) {
        e.preventDefault();
        const allDigits = digits.slice(0, digitsBefore - 1 < 1 ? 1 : digitsBefore) + digits.slice(digitsBefore);
        const formatted = allDigits.length <= 1 ? "" : formatPhone(allDigits);
        setPhone(formatted);
      }
    }
  }

  const loadAdmins = useCallback(async (role: string) => {
    if (role !== "owner") return;
    const res = await fetch(func2url["auth-admins"], {
      headers: { "X-User-Role": "owner" },
    });
    const data = await res.json();
    setAdmins(data.admins || []);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length < 11) { setError("Введите корректный номер телефона"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["auth-login"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка входа"); return; }
      setUser(data);
      if (data.role === "admin") {
        localStorage.setItem("admin_session", JSON.stringify(data));
      }
      await loadAdmins(data.role);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length < 11) { setError("Введите корректный номер телефона"); return; }
    if (password.length < 8) { setError("Пароль должен содержать минимум 8 символов"); return; }
    if (strength.score < 3) { setError("Используйте более надёжный пароль"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["auth-register"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка регистрации"); return; }
      setOwnerExists(true);
      setMode("login");
      setPhone("");
      setPassword("");
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAdmin(id: number) {
    const res = await fetch(`${func2url["auth-admins"]}?id=${id}`, {
      method: "DELETE",
      headers: { "X-User-Role": "owner" },
    });
    if (res.ok) {
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_session");
    setUser(null);
    setAdmins([]);
    setPhone("");
    setPassword("");
  }

  async function handleCreateAdmin(adminPhone: string, adminPassword: string): Promise<string | null> {
    const res = await fetch(func2url["auth-admins"], {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Role": "owner" },
      body: JSON.stringify({ phone: adminPhone, password: adminPassword }),
    });
    const data = await res.json();
    if (!res.ok) return data.error || "Ошибка создания";
    setAdmins((prev) => [...prev, data]);
    return null;
  }

  if (user && user.role === "admin") {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  if (user) {
    return <Dashboard user={user} admins={admins} onLogout={handleLogout} onDelete={handleDeleteAdmin} onCreate={handleCreateAdmin} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      <div className="w-full max-w-[400px] animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4">
            <Icon name="Shield" size={26} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Вход в систему" : "Регистрация владельца"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Введите данные для доступа" : "Создайте аккаунт владельца системы"}
          </p>
        </div>

        <div className="auth-glass rounded-2xl p-6 space-y-4">
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Номер телефона</label>
              <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full pl-9 pr-10 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                  autoComplete="tel"
                />
                {phone && (
                  <button
                    type="button"
                    onClick={() => { setPhone(""); setError(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Пароль</label>
              <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Lock" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Введите пароль"
                  className="w-full pl-9 pr-11 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>

              {mode === "register" && password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full strength-bar"
                        style={{ backgroundColor: i <= strength.score ? strength.color : "hsl(240 5% 20%)" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>{strength.label} пароль</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    <li className={`flex items-center gap-1 ${password.length >= 8 ? "text-green-500" : ""}`}>
                      <Icon name={password.length >= 8 ? "Check" : "X"} size={10} /> Минимум 8 символов
                    </li>
                    <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? "text-green-500" : ""}`}>
                      <Icon name={/[A-Z]/.test(password) ? "Check" : "X"} size={10} /> Заглавная буква (A-Z)
                    </li>
                    <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? "text-green-500" : ""}`}>
                      <Icon name={/[0-9]/.test(password) ? "Check" : "X"} size={10} /> Цифра (0-9)
                    </li>
                    <li className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}`}>
                      <Icon name={/[^A-Za-z0-9]/.test(password) ? "Check" : "X"} size={10} /> Спецсимвол (!@#$...)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2.5 border border-destructive/20">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Icon name="Loader2" size={16} className="animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт владельца"}
            </button>
          </form>

          {ownerExists === false && mode === "login" && (
            <div className="pt-2 text-center">
              <span className="text-sm text-muted-foreground">Нет аккаунта? </span>
              <button
                onClick={() => { setMode("register"); setError(""); setPhone(""); setPassword(""); }}
                className="text-sm text-primary font-medium hover:underline transition-all"
              >
                Регистрация
              </button>
            </div>
          )}
          {mode === "register" && (
            <div className="pt-2 text-center">
              <span className="text-sm text-muted-foreground">Уже есть аккаунт? </span>
              <button
                onClick={() => { setMode("login"); setError(""); setPhone(""); setPassword(""); }}
                className="text-sm text-primary font-medium hover:underline transition-all"
              >
                Войти
              </button>
            </div>
          )}
        </div>

        {mode === "login" && ownerExists && (
          <p className="text-center text-xs text-muted-foreground mt-4">Только для владельца системы</p>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [page, setPage] = useState<"home" | "catalog">("home");

  if (page === "catalog") {
    return <CatalogPage onBack={() => setPage("home")} />;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/4 blur-[100px]" />
      </div>

      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
              <Icon name="UserCircle" size={18} className="text-muted-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-sm leading-none">Панель администратора</h1>
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

      <main className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6">
            <Icon name="Hand" size={36} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Habari Msimamizi!</h2>
          <p className="text-muted-foreground text-base mb-8">Добро пожаловать в панель администратора</p>

          <div className="grid gap-3">
            <button
              onClick={() => setPage("catalog")}
              className="auth-glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon name="Package" size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">Номенклатура</p>
                <p className="text-muted-foreground text-xs mt-0.5">Каталог товаров, создание карточек</p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground ml-auto" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Dashboard({
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
      </main>
    </div>
  );
}