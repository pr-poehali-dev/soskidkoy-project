import { useState, useCallback, useEffect } from "react";
import func2url from "../../backend/func2url.json";
import { subscribeToPush } from "@/lib/push";
import AdminPanel from "@/components/AdminPanel";
import OwnerDashboard from "@/components/OwnerDashboard";
import AuthLoginForm from "@/components/AuthLoginForm";

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
      if (parsed.role === "admin") {
        subscribeToPush(parsed.id);
        return parsed;
      }
    }
    return null;
  });
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", "/admin-manifest.json");
    return () => {
      if (link) link.setAttribute("href", "/manifest.json");
    };
  }, []);

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
      subscribeToPush(data.id);
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
    return <OwnerDashboard user={user} admins={admins} onLogout={handleLogout} onDelete={handleDeleteAdmin} onCreate={handleCreateAdmin} />;
  }

  return (
    <AuthLoginForm
      mode={mode}
      phone={phone}
      password={password}
      showPassword={showPassword}
      error={error}
      loading={loading}
      ownerExists={ownerExists}
      strength={strength}
      onPhoneChange={handlePhoneChange}
      onPhoneKeyDown={handlePhoneKeyDown}
      onPasswordChange={(v) => { setPassword(v); setError(""); }}
      onTogglePassword={() => setShowPassword((p) => !p)}
      onLogin={handleLogin}
      onRegister={handleRegister}
      onSwitchMode={(m) => { setMode(m); setError(""); setPhone(""); setPassword(""); }}
    />
  );
}
