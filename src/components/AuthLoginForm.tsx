import Icon from "@/components/ui/icon";

type Mode = "login" | "register";

interface AuthLoginFormProps {
  mode: Mode;
  phone: string;
  password: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  ownerExists: boolean | null;
  strength: { score: number; label: string; color: string };
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  onSwitchMode: (mode: Mode) => void;
}

export default function AuthLoginForm({
  mode,
  phone,
  password,
  showPassword,
  error,
  loading,
  ownerExists,
  strength,
  onPhoneChange,
  onPhoneKeyDown,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onRegister,
  onSwitchMode,
}: AuthLoginFormProps) {
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
          <form onSubmit={mode === "login" ? onLogin : onRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Номер телефона</label>
              <div className="relative input-focus rounded-xl border border-border bg-input overflow-hidden">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Icon name="Phone" size={16} className="text-muted-foreground" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={onPhoneChange}
                  onKeyDown={onPhoneKeyDown}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
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
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder={mode === "login" ? "Введите пароль" : "Минимум 8 символов"}
                  className="w-full pl-10 pr-10 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
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
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
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
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl px-3 py-2.5 border border-destructive/20 animate-fade-in">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Icon name="Loader2" size={16} className="animate-spin" />}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>

          {mode === "register" && (
            <div className="pt-2 text-center">
              <span className="text-sm text-muted-foreground">Уже есть аккаунт? </span>
              <button
                onClick={() => onSwitchMode("login")}
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
