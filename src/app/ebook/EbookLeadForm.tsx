"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizarWhatsapp, whatsappValido } from "@/lib/whatsapp";

const DOWNLOAD_URL =
  "/ebook/ebook-autismo-o-que-nao-contaram-as-familias.pdf";
const DOWNLOAD_FILENAME =
  "Autismo - O Que Não Contaram Às Famílias.pdf";

type RpcResult = { status?: string; codigo?: string };

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

function erroParaMensagem(codigo: string | undefined): string {
  switch (codigo) {
    case "nome":
      return "Informe seu nome completo (mínimo de 2 caracteres).";
    case "whatsapp":
      return "Informe um WhatsApp válido com DDD. Ex.: (11) 99999-9999.";
    case "lgpd":
      return "Para liberar o download, é necessário autorizar o uso dos seus dados (LGPD).";
    default:
      return "Não foi possível liberar o download neste momento. Tente novamente.";
  }
}

function baixarArquivo() {
  const link = document.createElement("a");
  link.href = DOWNLOAD_URL;
  link.download = DOWNLOAD_FILENAME;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function EbookLeadForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const whatsapp = String(formData.get("whatsapp") ?? "").trim();
    const lgpd = formData.get("lgpd_consent") === "on";
    const honeypot = String(formData.get("website") ?? "").trim();

    if (nome.length < 2) {
      setState({
        status: "error",
        message: "Informe seu nome completo (mínimo de 2 caracteres).",
      });
      return;
    }

    if (!whatsappValido(whatsapp)) {
      setState({
        status: "error",
        message: "Informe um WhatsApp válido com DDD. Ex.: (11) 99999-9999.",
      });
      return;
    }

    if (!lgpd) {
      setState({
        status: "error",
        message:
          "Para liberar o download, é necessário autorizar o uso dos seus dados (LGPD).",
      });
      return;
    }

    if (honeypot || Date.now() - startedAt.current < 1200) {
      setState({ status: "success" });
      baixarArquivo();
      return;
    }

    setPending(true);
    setState({ status: "idle" });

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("registrar_lead_ebook", {
        p_nome: nome,
        p_whatsapp: normalizarWhatsapp(whatsapp),
        p_lgpd_consent: true,
        p_origem: "ebook-autismo",
      });

      if (error) {
        console.error("[EbookLeadForm] RPC error:", error);
        setState({ status: "error", message: erroParaMensagem(undefined) });
        return;
      }

      const resultado = (data ?? {}) as RpcResult;
      if (resultado.status !== "ok") {
        console.error("[EbookLeadForm] Unexpected RPC result:", data);
        setState({
          status: "error",
          message: erroParaMensagem(resultado.codigo),
        });
        return;
      }

      setState({ status: "success" });
      baixarArquivo();
    } catch {
      setState({
        status: "error",
        message: "Não foi possível liberar o download neste momento. Tente novamente.",
      });
    } finally {
      setPending(false);
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-800 text-2xl text-white"
        >
          ✓
        </span>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-brand-950">
          Download liberado
        </h2>
        <p className="mt-3 leading-relaxed text-brand-900/80">
          Obrigado pelo interesse. Se o download não iniciar automaticamente,
          use o botão abaixo.
        </p>
        <a
          href={DOWNLOAD_URL}
          download={DOWNLOAD_FILENAME}
          className="btn-primary mt-6 inline-flex"
        >
          Baixar o e-book (PDF)
        </a>
        <p className="mt-4 text-xs leading-relaxed text-brand-700/70">
          Você pode baixar o arquivo novamente quando precisar.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-brand-100 bg-white p-8"
    >
      {state.status === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.message}
        </div>
      )}

      <div className="grid gap-5">
        <div>
          <label htmlFor="nome" className="label">
            Nome completo
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            required
            autoComplete="name"
            className="input"
            placeholder="Como podemos chamar você?"
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="label">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            className="input"
            placeholder="(11) 99999-9999"
          />
          <p className="mt-2 text-xs leading-relaxed text-brand-700/70">
            Usaremos seu WhatsApp apenas para liberar o material e registrar
            seu interesse no e-book.
          </p>
        </div>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Não preencha este campo</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3">
        <input
          id="lgpd_consent"
          name="lgpd_consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-brand-300 accent-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        />
        <label
          htmlFor="lgpd_consent"
          className="text-sm leading-relaxed text-brand-900/80"
        >
          Autorizo o CPEPA a armazenar meu nome e WhatsApp para liberar o
          e-book e registrar meu interesse no material, nos termos da Lei Geral
          de Proteção de Dados (LGPD). Os dados não serão compartilhados com
          terceiros.
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Liberando download…" : "Quero baixar o e-book"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-brand-700/70">
        Download gratuito e imediato. Este material tem caráter informativo e
        não substitui acompanhamento individual.
      </p>
    </form>
  );
}
