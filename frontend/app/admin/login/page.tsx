"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState("login");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function handleLogin(e: any) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      setToken(data.access_token);
      if (data.totpEnabled) { setStep("totp"); } else { localStorage.setItem("token", data.access_token); router.push("/admin/dashboard"); }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }
  async function handleTotp(e: any) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("http://localhost:3001/auth/verify-2fa", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ token: totp }) });
      if (!res.ok) throw new Error("Code invalide");
      localStorage.setItem("token", token); router.push("/admin/dashboard");
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-thin tracking-[0.3em] uppercase">Track.Art</h1>
          <p className="text-gray-500 text-xs tracking-widest uppercase mt-2">{step === "login" ? "Administration" : "Vérification 2FA"}</p>
        </div>
        {step === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border border-gray-700 px-4 py-3 text-sm placeholder-gray-600 focus:border-white focus:outline-none transition-colors" required />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border border-gray-700 px-4 py-3 text-sm placeholder-gray-600 focus:border-white focus:outline-none transition-colors" required />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full border border-white py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50">{loading ? "Connexion..." : "Se connecter"}</button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-4">
            <p className="text-gray-400 text-xs text-center">Entrez le code de votre application d authentification</p>
            <input type="text" placeholder="123456" value={totp} onChange={e => setTotp(e.target.value)} className="w-full bg-transparent border border-gray-700 px-4 py-3 text-sm placeholder-gray-600 focus:border-white focus:outline-none text-center tracking-widest" maxLength={6} required />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full border border-white py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50">{loading ? "Vérification..." : "Vérifier"}</button>
          </form>
        )}
      </div>
    </main>
  );
}
