"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DIAS_VALIDOS = new Set([0, 1, 2, 3, 4, 5, 6]);
const RELACOES_VALIDAS = ["mae", "pai", "responsavel"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const dias = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

function normalizarHora(value: string): string | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, h, m, s = "00"] = match;
  const hora = Number(h);
  const min = Number(m);
  const seg = Number(s);
  if (hora > 23 || min > 59 || seg > 59) return null;
  return `${h}:${m}:${s}`;
}

type RpcResult = { status?: string; codigo?: string; responsavel_id?: string };

function erroParaMensagem(codigo: string | undefined): string {
  switch (codigo) {
    case "duplicado":
      return "Este e-mail já possui uma solicitação de escuta cadastrada. Se desejar enviar uma nova solicitação, entre em contato com o CPEPA.";
    case "lgpd":
      return "Para enviar a solicitação, é necessário autorizar o uso dos seus dados (LGPD).";
    default:
      return "Não foi possível registrar sua solicitação neste momento. Tente novamente.";
  }
}

export default function SolicitarEscutaForm() {
  const router = useRouter();
  const [state, setState] = useState<{ status: "idle" | "error" | "success" | "redirecting"; message?: string }>({ status: "idle" });
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const cidadeUf = String(formData.get("cidade_uf") ?? "").trim();
    const relacao = String(formData.get("relacao") ?? "") as "mae" | "pai" | "responsavel";
    const diaSemana = Number(formData.get("dia_semana"));
    const horaInicioRaw = String(formData.get("hora_inicio") ?? "");
    const horaFimRaw = String(formData.get("hora_fim") ?? "");
    const modalidade = String(formData.get("modalidade") ?? "") as "online" | "presencial";
    const mensagem = String(formData.get("mensagem") ?? "").trim();
    const lgpd = formData.get("lgpd_consent") === "on";

    if (
      !nome ||
      !EMAIL_REGEX.test(email) ||
      !RELACOES_VALIDAS.includes(relacao) ||
      !DIAS_VALIDOS.has(diaSemana) ||
      !["online", "presencial"].includes(modalidade) ||
      !lgpd
    ) {
      setState({
        status: "error",
        message: "Preencha corretamente os campos obrigatórios e aceite os termos.",
      });
      return;
    }

    const horaInicio = normalizarHora(horaInicioRaw);
    const horaFim = normalizarHora(horaFimRaw);

    if (!horaInicio || !horaFim || horaFim <= horaInicio) {
      setState({
        status: "error",
        message: "O horário de término deve ser posterior ao horário de início.",
      });
      return;
    }

    setPending(true);
    setState({ status: "idle" });

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("solicitar_escuta", {
        p_nome: nome,
        p_email: email,
        p_telefone: telefone || null,
        p_cidade_uf: cidadeUf || null,
        p_relacao: relacao,
        p_lgpd_consent: true,
        p_dia_semana: diaSemana,
        p_hora_inicio: horaInicio,
        p_hora_fim: horaFim,
        p_modalidade: modalidade,
        p_mensagem: mensagem || null,
      });

      if (error) {
        console.error("[SolicitarEscutaForm] RPC error:", error);
        setState({
          status: "error",
          message: erroParaMensagem(undefined),
        });
        return;
      }

      const resultado = (data ?? {}) as RpcResult;

      if (resultado.status !== "ok") {
        console.error("[SolicitarEscutaForm] Unexpected RPC result:", data);
        setState({
          status: "error",
          message: erroParaMensagem(resultado.codigo),
        });
        return;
      }

      // Sucesso - redireciona para página de acompanhamento
      const responsavelId = resultado.responsavel_id;
      if (responsavelId) {
        setState({ status: "redirecting", message: "Redirecionando..." });
        router.push(`/minhas-solicitacoes?resp=${responsavelId}`);
      } else {
        setState({
          status: "success",
          message: "Sua solicitação foi recebida. Acesse /minhas-solicitacoes para ver as indicações.",
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Não foi possível registrar sua solicitação neste momento. Tente novamente.",
      });
    } finally {
      setPending(false);
    }
  }

  if (state.status === "success" || state.status === "redirecting") {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-800 text-2xl text-white"
        >
          ✓
        </span>
        <h2 className="mt-5 font-serif text-2xl font-semibold text-brand-950">
          Solicitação recebida
        </h2>
        <p className="mt-3 leading-relaxed text-brand-900/80">
          {state.message}
        </p>
        {state.status !== "redirecting" && (
          <a href="/minhas-solicitacoes" className="btn-secondary mt-6 inline-block">
            Ver minhas solicitações
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-white p-8">
      {state.status === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {state.message}
        </div>
      )}

      <fieldset>
        <legend className="font-serif text-lg font-semibold text-brand-950">
          Seus dados
        </legend>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
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
            <label htmlFor="email" className="label">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="voce@email.com"
            />
          </div>

          <div>
            <label htmlFor="telefone" className="label">
              Telefone
            </label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              autoComplete="tel"
              className="input"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label htmlFor="cidade_uf" className="label">
              Cidade / UF
            </label>
            <input
              id="cidade_uf"
              name="cidade_uf"
              type="text"
              className="input"
              placeholder="Ex.: São Paulo / SP"
            />
          </div>

          <div>
            <label htmlFor="relacao" className="label">
              Você é
            </label>
            <select id="relacao" name="relacao" required className="input" defaultValue="">
              <option value="" disabled>
                Selecione
              </option>
              <option value="mae">Mãe</option>
              <option value="pai">Pai</option>
              <option value="responsavel">Responsável</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-serif text-lg font-semibold text-brand-950">
          Sua disponibilidade
        </legend>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dia_semana" className="label">
              Dia da semana
            </label>
            <select
              id="dia_semana"
              name="dia_semana"
              required
              className="input"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione o dia
              </option>
              {dias.map((dia) => (
                <option key={dia.value} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="modalidade" className="label">
              Modalidade
            </label>
            <select
              id="modalidade"
              name="modalidade"
              required
              className="input"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione
              </option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          <div>
            <label htmlFor="hora_inicio" className="label">
              Horário de início
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="hora_fim" className="label">
              Horário de término
            </label>
            <input
              id="hora_fim"
              name="hora_fim"
              type="time"
              required
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mensagem" className="label">
              Algo que queira compartilhar
            </label>
            <textarea
              id="mensagem"
              name="mensagem"
              rows={4}
              className="input resize-y"
              placeholder="Opcional. Se quiser, conte um pouco sobre o que você tem vivido."
            />
          </div>
        </div>
      </fieldset>

      <div className="mt-6 flex items-start gap-3">
        <input
          id="lgpd_consent"
          name="lgpd_consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-brand-300 accent-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
        />
        <label htmlFor="lgpd_consent" className="text-sm leading-relaxed text-brand-900/80">
          Autorizo o CPEPA a armazenar e utilizar meus dados exclusivamente
          para viabilizar a solicitação de escuta, nos termos da Lei Geral de
          Proteção de Dados (LGPD).
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Enviando…" : "Enviar solicitação"}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-brand-700/70">
        Ao enviar, você não assume nenhum compromisso. O primeiro contato serve
        apenas para aproximação — sem cobranças e sem respostas prontas.
      </p>
    </form>
  );
}