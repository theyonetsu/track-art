"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"login" | "totp">("login");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Identifiants invalides");
      setToken(data.access_token);
      if (data.totpEnabled) setStep("totp");
      else { localStorage.setItem("token", data.access_token); router.push("/admin/dashboard"); }
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); } finally { setLoading(false); }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/verify-2fa`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ token: totp }) });
      if (!res.ok) throw new Error("Code invalide");
      localStorage.setItem("token", token); router.push("/admin/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-sand text-ink grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block photo-placeholder" style={{ background: "linear-gradient(160deg, #EAD4C2 0%, #C99B7F 50%, #9E6B52 100%)" }} />
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col gap-10 fade-up">
          <div className="flex flex-col gap-3 items-center text-center">
            <Logo size="lg" />
            <p className="label text-muted">{step === "login" ? "Espace photographe" : "Vérification en deux étapes"}</p>
          </div>
          {step === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
              <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
              {error && <p className="text-terracotta text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">{loading ? "Connexion…" : "Se connecter"}</button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="flex flex-col gap-4">
              <p className="text-sm text-ink-soft text-center">Entrez le code de votre application d’authentification.</p>
              <input type="text" inputMode="numeric" placeholder="123456" value={totp} onChange={(e) => setTotp(e.target.value)} className="input text-center tracking-[0.4em]" maxLength={6} required />
              {error && <p className="text-terracotta text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">{loading ? "Vérification…" : "Vérifier"}</button>
            </form>
          )}
          <p className="text-center text-sm text-muted">Pas encore de compte ? <span className="text-ink">[Inscription à venir]</span></p>
        </div>
      </div>
    </main>
  );
}
