"use server";

import type { Modalidade, TipoRelacao } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export type SolicitarEscutaState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const DIAS_VALIDOS = new Set([0, 1, 2, 3, 4, 5, 6]);
const RELACOES_VALIDAS: TipoRelacao[] = ["mae", "pai", "responsavel"];
const MODALIDADES_VALIDAS: Modalidade[] = ["online", "presencial"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function solicitarEscuta(
  _prev: SolicitarEscutaState,
  formData: FormData,
): Promise<SolicitarEscutaState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const cidadeUf = String(formData.get("cidade_uf") ?? "").trim();
  const relacao = String(formData.get("relacao") ?? "") as TipoRelacao;
  const diaSemana = Number(formData.get("dia_semana"));
  const horaInicioRaw = String(formData.get("hora_inicio") ?? "");
  const horaFimRaw = String(formData.get("hora_fim") ?? "");
  const modalidade = String(formData.get("modalidade") ?? "") as Modalidade;
  const mensagem = String(formData.get("mensagem") ?? "").trim();
  const lgpd = formData.get("lgpd_consent") === "on";

  if (
    !nome ||
    !EMAIL_REGEX.test(email) ||
    !RELACOES_VALIDAS.includes(relacao) ||
    !DIAS_VALIDOS.has(diaSemana) ||
    !MODALIDADES_VALIDAS.includes(modalidade) ||
    !lgpd
  ) {
    return {
      status: "error",
      message:
        "Preencha corretamente os campos obrigatórios e aceite os termos.",
    };
  }

  const horaInicio = normalizarHora(horaInicioRaw);
  const horaFim = normalizarHora(horaFimRaw);

  if (!horaInicio || !horaFim || horaFim <= horaInicio) {
    return {
      status: "error",
      message: "O horário de término deve ser posterior ao horário de início.",
    };
  }

  const supabase = await createServerSupabaseClient();

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
    console.error("[solicitarEscuta] RPC error:", error);
    return {
      status: "error",
      message:
        "Não foi possível registrar sua solicitação neste momento. Tente novamente.",
    };
  }

  const resultado = (data ?? {}) as { status?: string; codigo?: string } | null;

  if (resultado?.status === "erro" && resultado?.codigo === "duplicado") {
    return {
      status: "error",
      message:
        "Este e-mail já possui uma solicitação de escuta cadastrada. Se desejar enviar uma nova solicitação, entre em contato com o CPEPA.",
    };
  }

  if (resultado?.status === "erro" && resultado?.codigo === "lgpd") {
    return {
      status: "error",
      message:
        "Para enviar a solicitação, é necessário autorizar o uso dos seus dados (LGPD).",
    };
  }

  if (resultado?.status !== "ok") {
    console.error("[solicitarEscuta] Unexpected RPC result:", resultado);
    return {
      status: "error",
      message:
        "Não foi possível registrar sua solicitação neste momento. Tente novamente.",
    };
  }

  return {
    status: "success",
    message:
      "Sua solicitação foi recebida. Em breve, o CPEPA entrará em contato para combinar os próximos passos da escuta.",
  };
}