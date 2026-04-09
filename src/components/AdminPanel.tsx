import { useState } from "react";
import Icon from "@/components/ui/icon";
import CatalogPage from "@/components/CatalogPage";

interface AuthUser {
  id: number;
  phone: string;
  role: "owner" | "admin";
  createdAt: string;
}

export default function AdminPanel({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
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
