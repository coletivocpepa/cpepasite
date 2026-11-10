import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface Payload {
  p_nome: string;
  p_email: string;
  p_telefone?: string | null;
  p_cidade_uf?: string | null;
  p_relacao: "mae" | "pai" | "responsavel";
  p_lgpd_consent: boolean;
  p_dia_semana: number;
  p_hora_inicio: string;
  p_hora_fim: string;
  p_modalidade: "online" | "presencial";
  p_mensagem?: string | null;
}

function corsHeaders(origin?: string) {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req.headers.get("Origin") ?? undefined) });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "erro", codigo: "metodo_invalido" }), {
      status: 405,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ status: "erro", codigo: "json_invalido" }), {
      status: 400,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  if (!payload.p_lgpd_consent) {
    return new Response(JSON.stringify({ status: "erro", codigo: "lgpd" }), {
      status: 400,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  const { data: existing, error: existErr } = await supabase
    .from("responsaveis")
    .select("id")
    .eq("email", payload.p_email)
    .maybeSingle();

  if (existErr) {
    console.error("query responsavel error:", existErr);
    return new Response(JSON.stringify({ status: "erro", codigo: "erro" }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  let responsavelId: string;

  if (existing) {
    // E-mail já cadastrado: só bloqueia se houver solicitação ativa.
    // Se o responsável não tiver solicitações ativas (ex.: excluídas pelo
    // admin), reutiliza o cadastro em vez de reforçar o bloqueio.
    const { data: ativas, error: ativasErr } = await supabase
      .from("solicitacoes")
      .select("id")
      .eq("responsavel_id", existing.id)
      .in("status", ["aberta", "em_andamento"])
      .limit(1);

    if (ativasErr) {
      console.error("query solicitacoes error:", ativasErr);
      return new Response(JSON.stringify({ status: "erro", codigo: "erro" }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
      });
    }

    if (ativas && ativas.length > 0) {
      return new Response(JSON.stringify({ status: "erro", codigo: "duplicado" }), {
        status: 409,
        headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
      });
    }

    responsavelId = existing.id;

    const { error: updErr } = await supabase
      .from("responsaveis")
      .update({
        nome: payload.p_nome,
        telefone: payload.p_telefone ?? null,
        cidade_uf: payload.p_cidade_uf ?? null,
        relacao: payload.p_relacao,
      })
      .eq("id", existing.id);

    if (updErr) {
      console.error("update responsavel error:", updErr);
      return new Response(JSON.stringify({ status: "erro", codigo: "erro" }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
      });
    }
  } else {
    const { data: resp, error: errResp } = await supabase
      .from("responsaveis")
      .insert({
        nome: payload.p_nome,
        email: payload.p_email,
        telefone: payload.p_telefone ?? null,
        cidade_uf: payload.p_cidade_uf ?? null,
        relacao: payload.p_relacao,
        lgpd_consent: true,
        lgpd_consent_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (errResp || !resp) {
      console.error("insert responsavel error:", errResp);
      return new Response(JSON.stringify({ status: "erro", codigo: "erro" }), {
        status: 500,
        headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
      });
    }

    responsavelId = resp.id;
  }

  const { error: errSol } = await supabase.from("solicitacoes").insert({
    responsavel_id: responsavelId,
    dia_semana: payload.p_dia_semana,
    hora_inicio: payload.p_hora_inicio,
    hora_fim: payload.p_hora_fim,
    modalidade: payload.p_modalidade,
    mensagem: payload.p_mensagem ?? null,
    status: "aberta",
  });

  if (errSol) {
    console.error("insert solicitacao error:", errSol);
    return new Response(JSON.stringify({ status: "erro", codigo: "erro" }), {
      status: 500,
      headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ status: "ok", responsavel_id: resp.id }), {
    status: 200,
    headers: { ...corsHeaders(req.headers.get("Origin") ?? undefined), "Content-Type": "application/json" },
  });
});