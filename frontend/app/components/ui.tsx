"use client";
import { useEffect } from "react";

export function Section({ title, hint, children, className = "" }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card p-6 flex flex-col gap-5 ${className}`}>
      <header className="flex flex-col gap-1 pb-3 border-b border-line">
        <h2 className="font-serif text-2xl">{title}</h2>
        {hint && <p className="help">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="help">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="subsection">{label}</span>
        {hint && <span className="help">{hint}</span>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="switch" aria-label={label} />
    </div>
  );
}

export function Toast({ message, onDone, error = false }: { message: string; onDone: () => void; error?: boolean }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 label px-5 py-3 fade-up ${error ? "bg-terracotta text-sand" : "bg-ink text-sand"}`} style={{ boxShadow: "var(--shadow-lift)" }}>
      {message}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5 flex flex-col gap-1">
      <span className="field-label">{label}</span>
      <span className="font-serif text-3xl num">{value}</span>
      {sub && <span className="meta">{sub}</span>}
    </div>
  );
}
