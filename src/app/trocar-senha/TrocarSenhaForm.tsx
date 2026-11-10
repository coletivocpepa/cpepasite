"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TrocarSenhaForm() {
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);

    // 1) limpa a flag de troca obrigatória antes de rotacionar a senha
    //    (o token atual ainda é válido). Não bloqueia por mais de 8s.
    try {
      await Promise.race([
        supabase.functions
          .invoke("criar-acesso-blog", { body: { acao: "confirmar_senha" } })
          .then(({ error: fnError }) => {
            if (fnError) {
              console.error("[trocar-senha] confirmar_senha:", fnError.message);
            }
          }),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    } catch (err) {
      console.error("[trocar-senha] confirmar_senha:", err);
    }

    // 2) troca a senha
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    // 3) renova o token (best-effort) e navega; o gate do proxy consulta o
    //    banco (deve_trocar_senha), então a navegação não depende do JWT.
    try {
      await supabase.auth.refreshSession();
    } catch {
      // segue mesmo assim
    }

    window.location.href = "/admin/blog";
  }

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="label">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Mínimo de 6 caracteres"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="label">
            Confirme a nova senha
          </label>
          <input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input"
            placeholder="Repita a senha"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
