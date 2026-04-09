import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";
import { normalizeText } from "@/lib/normalize";

type Mode = "login" | "register";
type SortField = "name" | "base_price" | "date";
type SortDirection = "asc" | "desc";

interface CustomerSession {
  id: number;
  phone: string;
}

interface ShopItem {
  id: number;
  name: string;
  article: string;
  image_url: string;
  base_price: number;
  products_count: number;
  min_retail: number;
  max_retail: number;
  latest_product_date: string;
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

function formatPrice(v: number) {
  return v.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function Shop() {
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<CustomerSession | null>(() => {
    const saved = localStorage.getItem("customer_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Catalog state
  const [items, setItems] = useState<ShopItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(() => {
    const saved = localStorage.getItem("shop_sort_field");
    return (saved === "name" || saved === "base_price" || saved === "date") ? saved : "date";
  });
  const [sortDir, setSortDir] = useState<SortDirection>(() => {
    const saved = localStorage.getItem("shop_sort_dir");
    return saved === "asc" ? "asc" : "desc";
  });

  const strength = getPasswordStrength(password);

  useEffect(() => {
    localStorage.setItem("shop_sort_field", sortField);
  }, [sortField]);

  useEffect(() => {
    localStorage.setItem("shop_sort_dir", sortDir);
  }, [sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length < 11) {
      setError("Введите корректный номер телефона");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["customer-login"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка входа");
        return;
      }
      const customerSession: CustomerSession = { id: data.id, phone: data.phone };
      localStorage.setItem("customer_session", JSON.stringify(customerSession));
      setSession(customerSession);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (rawDigits.length < 11) {
      setError("Введите корректный номер телефона");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен содержать минимум 8 символов");
      return;
    }
    if (strength.score < 3) {
      setError("Используйте более надёжный пароль");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(func2url["customer-register"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка регистрации");
        return;
      }
      setMode("login");
      setPhone("");
      setPassword("");
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("customer_session");
    setSession(null);
    setItems([]);
    setPhone("");
    setPassword("");
  }

  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const res = await fetch(func2url["customer-catalog"]);
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setCatalogLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      loadCatalog();
    }
  }, [session]);

  // Filtering
  const query = searchQuery.trim().toLowerCase();
  const normalizedQuery = normalizeText(query);
  const filteredItems = query
    ? items.filter((n) => {
        const normName = normalizeText(n.name.toLowerCase());
        const normArticle = normalizeText((n.article || "").toLowerCase());
        return normName.includes(normalizedQuery) || normArticle.includes(normalizedQuery);
      })
    : items;

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    let cmp = 0;
    if (sortField === "name") {
      cmp = a.name.localeCompare(b.name, "ru");
    } else if (sortField === "base_price") {
      cmp = a.min_retail - b.min_retail;
    } else {
      const aDate = a.latest_product_date || "";
      const bDate = b.latest_product_date || "";
      cmp = new Date(aDate).getTime() - new Date(bDate).getTime();
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // --- Catalog view ---
  if (session) {
    return (
      <div className="min-h-screen bg-background animate-fade-in">
        <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="font-bold text-foreground">Товары</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              <Icon name="LogOut" size={16} />
              Выйти
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          {catalogLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 animate-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary border border-border mb-4">
                <Icon name="Package" size={28} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Каталог пуст</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="Search" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или артикулу"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon name="X" size={14} />
                  </button>
                )}
              </div>

              {/* Sort buttons */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                <span className="text-xs text-muted-foreground flex-shrink-0">Сортировка:</span>
                {([
                  { field: "date" as SortField, label: "По дате", icon: "Calendar" },
                  { field: "name" as SortField, label: "По алфавиту", icon: "ArrowDownAZ" },
                  { field: "base_price" as SortField, label: "По цене", icon: "Banknote" },
                ]).map((s) => {
                  const active = sortField === s.field;
                  return (
                    <button
                      key={s.field}
                      type="button"
                      onClick={() => toggleSort(s.field)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex-shrink-0 ${
                        active
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon name={s.icon} size={13} />
                      {s.label}
                      {active && (
                        <Icon name={sortDir === "asc" ? "ArrowUp" : "ArrowDown"} size={12} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Items grid or empty search */}
              {sortedItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border mb-3">
                    <Icon name="SearchX" size={22} className="text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Ничего не найдено по запросу &laquo;{searchQuery}&raquo;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedItems.map((item) => {
                    const hasRange = item.min_retail !== item.max_retail;
                    return (
                      <div
                        key={item.id}
                        className="auth-glass rounded-2xl overflow-hidden hover:border-primary/30 transition-all group text-left"
                      >
                        <div className="aspect-square bg-secondary/50 relative overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="Image" size={40} className="text-muted-foreground/30" />
                            </div>
                          )}
                          {item.products_count > 0 && (
                            <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-primary/90 text-primary-foreground text-xs font-bold">
                              {item.products_count} шт
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                            {item.name}
                          </h3>
                          {item.article && (
                            <p className="text-xs text-muted-foreground truncate">
                              Арт. {item.article}
                            </p>
                          )}
                          <div className="pt-1">
                            <p className="text-primary font-bold text-sm">
                              {hasRange
                                ? `${formatPrice(item.min_retail)} – ${formatPrice(item.max_retail)} \u20BD`
                                : `${formatPrice(item.min_retail)} \u20BD`}
                            </p>
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(item.base_price)} &#8381;
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // --- Auth view ---
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
            {mode === "login" ? "Вход для покупателей" : "Регистрация покупателя"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "login" ? "Введите данные для доступа" : "Создайте аккаунт покупателя"}
          </p>
        </div>

        <div className="auth-glass rounded-2xl p-6 space-y-4">
          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Номер телефона</label>
              <div className="relative input-focus rounded-xl border border-border">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full pl-10 pr-4 py-3 bg-transparent rounded-xl text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Пароль</label>
              <div className="relative input-focus rounded-xl border border-border">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Icon name="Lock" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Введите пароль"
                  className="w-full pl-10 pr-10 py-3 bg-transparent rounded-xl text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {mode === "register" && password.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Надёжность пароля</span>
                  <span style={{ color: strength.color }} className="font-medium">
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full strength-bar"
                    style={{
                      width: `${(strength.score / 5) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <Icon name="AlertCircle" size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
                  {mode === "login" ? "Войти" : "Зарегистрироваться"}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setPassword("");
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
